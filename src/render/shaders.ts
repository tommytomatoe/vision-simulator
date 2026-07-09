export const VERT_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const COPY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 uv = vUv * uUvScale + uUvOffset;
  outColor = texture(uTex, uv);
}`;

export const BLUR_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;   // 1/resolution
uniform vec2 uDir;     // unit blur direction (pixel space)
uniform float uSigma;  // px
uniform float uStride; // px between taps
in vec2 vUv;
out vec4 outColor;
void main() {
  if (uSigma < 0.5) { outColor = texture(uTex, vUv); return; }
  vec4 acc = texture(uTex, vUv);
  float wSum = 1.0;
  for (int i = 1; i <= 48; i++) {
    float d = float(i) * uStride;
    if (d > 3.0 * uSigma) break;
    float w = exp(-0.5 * (d * d) / (uSigma * uSigma));
    vec2 off = uDir * uTexel * d;
    acc += w * texture(uTex, vUv + off);
    acc += w * texture(uTex, vUv - off);
    wSum += 2.0 * w;
  }
  outColor = acc / wSum;
}`;

export const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSharp;
uniform sampler2D uBlur0;
uniform sampler2D uBlur1;
uniform int uEyeCount;
uniform int uMode;   // 0 blurred, 1 sharp, 2 wipe
uniform float uWipe; // 0..1 (sharp left of boundary)
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 sharp = texture(uSharp, vUv);
  vec4 blur = texture(uBlur0, vUv);
  if (uEyeCount == 2) blur = 0.5 * (texture(uBlur0, vUv) + texture(uBlur1, vUv));
  vec4 col;
  if (uMode == 1) col = sharp;
  else if (uMode == 0) col = blur;
  else col = (vUv.x < uWipe) ? sharp : blur;
  outColor = vec4(col.rgb, 1.0);
}`;
