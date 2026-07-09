import { createProgram, createFramebuffer, resizeFramebuffer, Framebuffer } from './glUtils';
import { VERT_SRC, COPY_FRAG, BLUR_FRAG, COMPOSITE_FRAG } from './shaders';
import { EyeMeridians, BlurParams } from '../optics/types';
import { computeBlur, DEFAULT_BLUR_GAIN } from '../optics/blur';

const MAX_INTERNAL = 900; // cap longest internal side for performance

export type RenderMode = 'blurred' | 'sharp' | 'wipe';

export interface RenderOptions {
  mode: RenderMode;
  wipe: number; // 0..1
  blurGain?: number;
}

export class VisionRenderer {
  private gl: WebGL2RenderingContext;
  private quad: WebGLBuffer;
  private copyProg: WebGLProgram;
  private blurProg: WebGLProgram;
  private compProg: WebGLProgram;
  private srcTex: WebGLTexture;
  private sharp!: Framebuffer;
  private work0!: Framebuffer;
  private results: Framebuffer[] = [];
  private iw = 0;
  private ih = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    this.copyProg = createProgram(gl, VERT_SRC, COPY_FRAG);
    this.blurProg = createProgram(gl, VERT_SRC, BLUR_FRAG);
    this.compProg = createProgram(gl, VERT_SRC, COMPOSITE_FRAG);
    this.srcTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  }

  get internalWidth(): number {
    return this.iw;
  }

  private bindQuad(prog: WebGLProgram): void {
    const gl = this.gl;
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  private ensureSize(displayW: number, displayH: number): void {
    const gl = this.gl;
    const longest = Math.max(displayW, displayH);
    const scale = longest > MAX_INTERNAL ? MAX_INTERNAL / longest : 1;
    const iw = Math.max(2, Math.round(displayW * scale));
    const ih = Math.max(2, Math.round(displayH * scale));
    if (iw === this.iw && ih === this.ih && this.sharp) return;
    this.iw = iw;
    this.ih = ih;
    if (!this.sharp) {
      this.sharp = createFramebuffer(gl, iw, ih);
      this.work0 = createFramebuffer(gl, iw, ih);
      this.results = [createFramebuffer(gl, iw, ih), createFramebuffer(gl, iw, ih)];
    } else {
      resizeFramebuffer(gl, this.sharp, iw, ih);
      resizeFramebuffer(gl, this.work0, iw, ih);
      resizeFramebuffer(gl, this.results[0], iw, ih);
      resizeFramebuffer(gl, this.results[1], iw, ih);
    }
  }

  private drawTo(fb: Framebuffer | null, w: number, h: number): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb ? fb.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  render(
    source: TexImageSource,
    srcW: number,
    srcH: number,
    eyes: EyeMeridians[],
    opts: RenderOptions,
  ): void {
    const gl = this.gl;
    const displayW = this.canvas.width;
    const displayH = this.canvas.height;
    if (displayW < 2 || displayH < 2) return;
    this.ensureSize(displayW, displayH);
    const { iw, ih } = this;

    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

    // cover-fit uv transform
    const srcAspect = srcW / srcH;
    const dstAspect = iw / ih;
    let sx = 1;
    let sy = 1;
    if (srcAspect > dstAspect) sx = dstAspect / srcAspect;
    else sy = srcAspect / dstAspect;
    const ox = (1 - sx) / 2;
    const oy = (1 - sy) / 2;

    gl.useProgram(this.copyProg);
    this.bindQuad(this.copyProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.uniform1i(gl.getUniformLocation(this.copyProg, 'uTex'), 0);
    gl.uniform2f(gl.getUniformLocation(this.copyProg, 'uUvScale'), sx, sy);
    gl.uniform2f(gl.getUniformLocation(this.copyProg, 'uUvOffset'), ox, oy);
    this.drawTo(this.sharp, iw, ih);

    const gain = opts.blurGain ?? DEFAULT_BLUR_GAIN;
    const eyeCount = Math.min(2, eyes.length);
    gl.useProgram(this.blurProg);
    gl.uniform2f(gl.getUniformLocation(this.blurProg, 'uTexel'), 1 / iw, 1 / ih);
    for (let e = 0; e < eyeCount; e++) {
      const bp = computeBlur(eyes[e], iw, gain);
      this.blurEye(bp, this.results[e]);
    }

    gl.useProgram(this.compProg);
    this.bindQuad(this.compProg);
    const modeInt = opts.mode === 'blurred' ? 0 : opts.mode === 'sharp' ? 1 : 2;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sharp.tex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, 'uSharp'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.results[0].tex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, 'uBlur0'), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.results[Math.min(1, Math.max(0, eyeCount - 1))].tex);
    gl.uniform1i(gl.getUniformLocation(this.compProg, 'uBlur1'), 2);
    gl.uniform1i(gl.getUniformLocation(this.compProg, 'uEyeCount'), eyeCount);
    gl.uniform1i(gl.getUniformLocation(this.compProg, 'uMode'), modeInt);
    gl.uniform1f(gl.getUniformLocation(this.compProg, 'uWipe'), opts.wipe);
    this.drawTo(null, displayW, displayH);
  }

  private blurEye(bp: BlurParams, out: Framebuffer): void {
    const d1x = Math.cos(bp.angleRad);
    const d1y = Math.sin(bp.angleRad);
    const d2x = -Math.sin(bp.angleRad);
    const d2y = Math.cos(bp.angleRad);
    this.bindQuad(this.blurProg);
    // pass 1: sharp -> work0 along meridian 1
    this.blurPass(this.sharp.tex, this.work0, d1x, d1y, bp.sigma1);
    // pass 2: work0 -> out along meridian 2
    this.blurPass(this.work0.tex, out, d2x, d2y, bp.sigma2);
  }

  private blurPass(inTex: WebGLTexture, out: Framebuffer, dx: number, dy: number, sigma: number): void {
    const gl = this.gl;
    const stride = Math.max(1, Math.ceil((3 * sigma) / 48));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inTex);
    gl.uniform1i(gl.getUniformLocation(this.blurProg, 'uTex'), 0);
    gl.uniform2f(gl.getUniformLocation(this.blurProg, 'uDir'), dx, dy);
    gl.uniform1f(gl.getUniformLocation(this.blurProg, 'uSigma'), sigma);
    gl.uniform1f(gl.getUniformLocation(this.blurProg, 'uStride'), stride);
    this.drawTo(out, this.iw, this.ih);
  }

  dispose(): void {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
