# Vision Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static web app that simulates severe myopia + astigmatism (the author's −13/−14 prescription) applied in real time to a live camera feed, procedural scenes, or infinite Creative Commons photos, with an adjustable prescription and a corrected-vs-uncorrected comparison.

**Architecture:** Vite + React + TypeScript front end deployed static to Netlify. Pure `optics` functions turn a prescription into oriented elliptical-blur parameters. A framework-agnostic `VisionRenderer` (raw WebGL2, two-pass separable directional blur) renders those onto a live source. React wires UI state to the renderer via a requestAnimationFrame loop.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), Vitest + React Testing Library (unit), Playwright (E2E), raw WebGL2 (no WebGL libs), Openverse public API (keyless), Netlify static hosting.

## Global Constraints

- TypeScript `strict: true`; no `any` in committed code.
- No secret keys, no backend, no serverless functions. Openverse is keyless and client-side.
- Default prescription is the author's Rx: OD `sph −13.25, cyl −3.25, axis 5`; OS `sph −15.00, cyl −1.25, axis 180`.
- Blur has exactly ONE calibration knob: `DEFAULT_BLUR_GAIN = 0.0012` (px sigma per diopter per px of canvas width).
- Astigmatism convention (negative-cyl): power at the axis meridian = SPH; power at axis+90° = SPH + CYL.
- Attribution chip (creator · license · source link) is ALWAYS visible when an Openverse photo is displayed.
- Mobile-first, touch-friendly; camera defaults to rear-facing (`facingMode: 'environment'`).
- Eye selection default is `both`; correction mode default is `blurred`.
- Graceful degradation: camera denied → fall back to scene; Openverse fail → fall back to scene; no WebGL2 → clear notice, not a blank screen.

---

### Task 1: Project scaffold, tooling, Netlify config

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `netlify.toml`, `.gitignore` (exists — verify), `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `playwright.config.ts`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: a runnable dev server, `npm test` (Vitest) and `npm run test:e2e` (Playwright), `npm run build` → `dist/`, `npm run typecheck`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "vision-simulator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts` (with Vitest config)**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
});
```

- [ ] **Step 4: Create `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `tests/setup.ts`**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>See Through My Eyes — Vision Simulator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`src/App.tsx` (placeholder, replaced in Task 6):
```tsx
export function App() {
  return <div>Vision Simulator</div>;
}
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`tests/setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create `netlify.toml`, `playwright.config.ts`, empty `src/App.css`**

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

`src/App.css`: create empty file (filled in Task 6).

- [ ] **Step 6: Write the smoke test**

`tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('scaffold', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Install and verify**

Run: `npm install && npm run typecheck && npm test`
Expected: install succeeds; typecheck passes; smoke test PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+TS with Vitest, Playwright, Netlify config"
```

---

### Task 2: optics — types and meridians

**Files:**
- Create: `src/optics/types.ts`, `src/optics/meridians.ts`
- Test: `tests/optics/meridians.test.ts`

**Interfaces:**
- Produces:
  - `EyeRx { sph: number; cyl: number; axis: number }`
  - `Prescription { right: EyeRx; left: EyeRx }`
  - `EyeSelection = 'left' | 'right' | 'both'`
  - `MeridianPower { angleDeg: number; power: number }`
  - `EyeMeridians { m1: MeridianPower; m2: MeridianPower }`
  - `BlurParams { sigma1: number; sigma2: number; angleRad: number }`
  - `eyeMeridians(rx: EyeRx): EyeMeridians`

- [ ] **Step 1: Write `src/optics/types.ts`**

```ts
export interface EyeRx {
  sph: number;   // diopters (negative for myopia)
  cyl: number;   // diopters (negative-cyl convention)
  axis: number;  // degrees, 0..180
}

export interface Prescription {
  right: EyeRx;  // OD
  left: EyeRx;   // OS
}

export type EyeSelection = 'left' | 'right' | 'both';

export interface MeridianPower {
  angleDeg: number; // normalized 0..180
  power: number;    // diopters
}

export interface EyeMeridians {
  m1: MeridianPower; // at axis, power = sph
  m2: MeridianPower; // at axis+90, power = sph + cyl
}

export interface BlurParams {
  sigma1: number;   // px, spread along m1 direction
  sigma2: number;   // px, spread along m2 direction
  angleRad: number; // m1 direction from +x axis, radians
}
```

- [ ] **Step 2: Write the failing test**

`tests/optics/meridians.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { eyeMeridians } from '../../src/optics/meridians';

describe('eyeMeridians', () => {
  it('splits OD (-13.25, -3.25, axis 5) into two meridians', () => {
    const m = eyeMeridians({ sph: -13.25, cyl: -3.25, axis: 5 });
    expect(m.m1.angleDeg).toBeCloseTo(5);
    expect(m.m1.power).toBeCloseTo(-13.25);
    expect(m.m2.angleDeg).toBeCloseTo(95);
    expect(m.m2.power).toBeCloseTo(-16.5);
  });

  it('normalizes axis 180 to 0 and wraps the perpendicular to 90', () => {
    const m = eyeMeridians({ sph: -15, cyl: -1.25, axis: 180 });
    expect(m.m1.angleDeg).toBeCloseTo(0);
    expect(m.m1.power).toBeCloseTo(-15);
    expect(m.m2.angleDeg).toBeCloseTo(90);
    expect(m.m2.power).toBeCloseTo(-16.25);
  });

  it('a pure sphere has equal-power meridians', () => {
    const m = eyeMeridians({ sph: -4, cyl: 0, axis: 0 });
    expect(m.m1.power).toBeCloseTo(-4);
    expect(m.m2.power).toBeCloseTo(-4);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- meridians`
Expected: FAIL — cannot find module `meridians`.

- [ ] **Step 4: Write `src/optics/meridians.ts`**

```ts
import { EyeRx, EyeMeridians } from './types';

function normalizeAngle(deg: number): number {
  let a = deg % 180;
  if (a < 0) a += 180;
  return a;
}

export function eyeMeridians(rx: EyeRx): EyeMeridians {
  return {
    m1: { angleDeg: normalizeAngle(rx.axis), power: rx.sph },
    m2: { angleDeg: normalizeAngle(rx.axis + 90), power: rx.sph + rx.cyl },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- meridians`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/optics/types.ts src/optics/meridians.ts tests/optics/meridians.test.ts
git commit -m "feat(optics): prescription types and meridian decomposition"
```

---

### Task 3: optics — blur mapping and presets

**Files:**
- Create: `src/optics/blur.ts`, `src/optics/presets.ts`
- Test: `tests/optics/blur.test.ts`

**Interfaces:**
- Consumes: `EyeMeridians`, `BlurParams`, `Prescription` from `src/optics/types.ts`; `eyeMeridians`.
- Produces:
  - `DEFAULT_BLUR_GAIN = 0.0012`
  - `computeBlur(m: EyeMeridians, canvasWidthPx: number, blurGain?: number): BlurParams`
  - `Preset { id: string; label: string; rx: Prescription }`
  - `TOMMY_RX: Prescription`, `PRESETS: Preset[]`, `DEFAULT_PRESET_ID = 'tommy'`

- [ ] **Step 1: Write the failing test**

`tests/optics/blur.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeBlur, DEFAULT_BLUR_GAIN } from '../../src/optics/blur';
import { eyeMeridians } from '../../src/optics/meridians';
import { PRESETS, TOMMY_RX, DEFAULT_PRESET_ID } from '../../src/optics/presets';

describe('computeBlur', () => {
  it('scales sigma with diopters, width, and gain', () => {
    const m = eyeMeridians({ sph: -13.25, cyl: -3.25, axis: 5 });
    const bp = computeBlur(m, 1000, DEFAULT_BLUR_GAIN);
    expect(bp.sigma1).toBeCloseTo(0.0012 * 13.25 * 1000, 3); // 15.9
    expect(bp.sigma2).toBeCloseTo(0.0012 * 16.5 * 1000, 3);  // 19.8
    expect(bp.angleRad).toBeCloseTo((5 * Math.PI) / 180, 6);
  });

  it('produces equal sigmas for a pure sphere', () => {
    const m = eyeMeridians({ sph: -6, cyl: 0, axis: 90 });
    const bp = computeBlur(m, 800);
    expect(bp.sigma1).toBeCloseTo(bp.sigma2, 6);
  });
});

describe('presets', () => {
  it("includes the author's Rx as the default preset", () => {
    const def = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    expect(def).toBeDefined();
    expect(def!.rx).toEqual(TOMMY_RX);
    expect(TOMMY_RX.right.sph).toBe(-13.25);
    expect(TOMMY_RX.left.sph).toBe(-15);
  });

  it('has unique preset ids', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- blur`
Expected: FAIL — cannot find modules `blur` / `presets`.

- [ ] **Step 3: Write `src/optics/blur.ts`**

```ts
import { EyeMeridians, BlurParams } from './types';

/**
 * Single calibration knob: Gaussian sigma (px) per diopter per px of canvas
 * width. Bundles assumed pupil diameter, field-of-view, and the blur-disc →
 * Gaussian-sigma conversion. Tuned by eye against real vision.
 */
export const DEFAULT_BLUR_GAIN = 0.0012;

export function computeBlur(
  m: EyeMeridians,
  canvasWidthPx: number,
  blurGain: number = DEFAULT_BLUR_GAIN,
): BlurParams {
  return {
    sigma1: blurGain * Math.abs(m.m1.power) * canvasWidthPx,
    sigma2: blurGain * Math.abs(m.m2.power) * canvasWidthPx,
    angleRad: (m.m1.angleDeg * Math.PI) / 180,
  };
}
```

- [ ] **Step 4: Write `src/optics/presets.ts`**

```ts
import { Prescription } from './types';

export interface Preset {
  id: string;
  label: string;
  rx: Prescription;
}

export const TOMMY_RX: Prescription = {
  right: { sph: -13.25, cyl: -3.25, axis: 5 },
  left: { sph: -15.0, cyl: -1.25, axis: 180 },
};

export const DEFAULT_PRESET_ID = 'tommy';

export const PRESETS: Preset[] = [
  {
    id: 'mild',
    label: 'Mild',
    rx: {
      right: { sph: -1.0, cyl: 0, axis: 0 },
      left: { sph: -1.25, cyl: 0, axis: 0 },
    },
  },
  {
    id: 'moderate',
    label: 'Moderate',
    rx: {
      right: { sph: -4.0, cyl: -0.75, axis: 90 },
      left: { sph: -4.5, cyl: -0.5, axis: 90 },
    },
  },
  { id: 'tommy', label: "Tommy's eyes (−13/−14)", rx: TOMMY_RX },
  {
    id: 'strong',
    label: 'Very strong (−8)',
    rx: {
      right: { sph: -8.0, cyl: -2.0, axis: 45 },
      left: { sph: -8.5, cyl: -2.0, axis: 135 },
    },
  },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- blur`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/optics/blur.ts src/optics/presets.ts tests/optics/blur.test.ts
git commit -m "feat(optics): diopter→sigma blur mapping and Rx presets"
```

---

### Task 4: engine — selectedEyes helper

**Files:**
- Create: `src/engine/selectedEyes.ts`
- Test: `tests/engine/selectedEyes.test.ts`

**Interfaces:**
- Consumes: `Prescription`, `EyeSelection`, `EyeMeridians`; `eyeMeridians`.
- Produces: `selectedEyes(rx: Prescription, sel: EyeSelection): EyeMeridians[]` — length 1 for `left`/`right`, length 2 (`[right, left]`) for `both`.

- [ ] **Step 1: Write the failing test**

`tests/engine/selectedEyes.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectedEyes } from '../../src/engine/selectedEyes';
import { TOMMY_RX } from '../../src/optics/presets';

describe('selectedEyes', () => {
  it('returns one eye for right', () => {
    const e = selectedEyes(TOMMY_RX, 'right');
    expect(e).toHaveLength(1);
    expect(e[0].m1.power).toBeCloseTo(-13.25);
  });

  it('returns one eye for left', () => {
    const e = selectedEyes(TOMMY_RX, 'left');
    expect(e).toHaveLength(1);
    expect(e[0].m1.power).toBeCloseTo(-15);
  });

  it('returns both eyes as [right, left] for both', () => {
    const e = selectedEyes(TOMMY_RX, 'both');
    expect(e).toHaveLength(2);
    expect(e[0].m1.power).toBeCloseTo(-13.25);
    expect(e[1].m1.power).toBeCloseTo(-15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- selectedEyes`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `src/engine/selectedEyes.ts`**

```ts
import { Prescription, EyeSelection, EyeMeridians } from '../optics/types';
import { eyeMeridians } from '../optics/meridians';

export function selectedEyes(rx: Prescription, sel: EyeSelection): EyeMeridians[] {
  const right = eyeMeridians(rx.right);
  const left = eyeMeridians(rx.left);
  if (sel === 'right') return [right];
  if (sel === 'left') return [left];
  return [right, left];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- selectedEyes`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/selectedEyes.ts tests/engine/selectedEyes.test.ts
git commit -m "feat(engine): selectedEyes maps prescription+selection to meridians"
```

---

### Task 5: render — WebGL2 VisionRenderer

**Files:**
- Create: `src/render/glUtils.ts`, `src/render/shaders.ts`, `src/render/VisionRenderer.ts`
- Test: `tests/render/renderer.test.ts`

**Interfaces:**
- Consumes: `EyeMeridians`, `BlurParams`; `computeBlur`, `DEFAULT_BLUR_GAIN`.
- Produces:
  - `glUtils`: `createShader`, `createProgram`, `Framebuffer { fbo; tex; width; height }`, `createFramebuffer(gl, w, h): Framebuffer`, `resizeFramebuffer(gl, fb, w, h): void`
  - `shaders`: `VERT_SRC`, `COPY_FRAG`, `BLUR_FRAG`, `COMPOSITE_FRAG`
  - `VisionRenderer` class with `constructor(canvas: HTMLCanvasElement)` (throws `'WebGL2 not supported'` if unavailable), `get internalWidth(): number`, `render(source: TexImageSource, srcW: number, srcH: number, eyes: EyeMeridians[], opts: RenderOptions): void`, `dispose(): void`
  - `RenderMode = 'blurred' | 'sharp' | 'wipe'`
  - `RenderOptions { mode: RenderMode; wipe: number; blurGain?: number }`

- [ ] **Step 1: Write `src/render/glUtils.ts`**

```ts
export function createShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error: ' + log);
  }
  return sh;
}

export function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    throw new Error('Program link error: ' + log);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

export interface Framebuffer {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

export function createFramebuffer(gl: WebGL2RenderingContext, width: number, height: number): Framebuffer {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, width, height };
}

export function resizeFramebuffer(gl: WebGL2RenderingContext, fb: Framebuffer, width: number, height: number): void {
  if (fb.width === width && fb.height === height) return;
  gl.bindTexture(gl.TEXTURE_2D, fb.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  fb.width = width;
  fb.height = height;
}
```

- [ ] **Step 2: Write `src/render/shaders.ts`**

```ts
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
```

- [ ] **Step 3: Write `src/render/VisionRenderer.ts`**

```ts
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
```

- [ ] **Step 4: Write the guard test**

`tests/render/renderer.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { VisionRenderer } from '../../src/render/VisionRenderer';

describe('VisionRenderer', () => {
  it('throws a clear error when WebGL2 is unavailable', () => {
    const canvas = { getContext: vi.fn().mockReturnValue(null) } as unknown as HTMLCanvasElement;
    expect(() => new VisionRenderer(canvas)).toThrow('WebGL2 not supported');
  });
});
```

Note: full pixel-level fidelity is verified visually in the app and via the Task 10 E2E DOM checks — jsdom has no WebGL2, so unit tests cover the guard and the optics math only.

- [ ] **Step 5: Run tests**

Run: `npm test -- renderer`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/render tests/render
git commit -m "feat(render): WebGL2 VisionRenderer with two-pass directional blur"
```

---

### Task 6: sources — procedural scenes, camera, Openverse, image loader

**Files:**
- Create: `src/sources/scenes.ts`, `src/sources/camera.ts`, `src/sources/openverse.ts`, `src/sources/loadImage.ts`
- Test: `tests/sources/openverse.test.ts`, `tests/sources/scenes.test.ts`

**Interfaces:**
- Produces:
  - `Scene { id: string; label: string; render: () => HTMLCanvasElement }`, `SCENES: Scene[]`, `renderEyeChart()`, `renderFanChart()`, `renderTextPage()`
  - `CameraHandle { video: HTMLVideoElement; stop: () => void }`, `startCamera(facingMode?: 'environment' | 'user'): Promise<CameraHandle>`
  - `Photo { id; url; creator; license; licenseUrl; sourceUrl; title }`, `fetchPhotos(query?: string, pageSize?: number): Promise<Photo[]>`
  - `loadImage(url: string): Promise<HTMLImageElement>` (sets `crossOrigin='anonymous'`)

- [ ] **Step 1: Write `src/sources/scenes.ts`**

```ts
export interface Scene {
  id: string;
  label: string;
  render: () => HTMLCanvasElement;
}

export function renderEyeChart(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rows = [
    { size: 300, text: 'E' },
    { size: 200, text: 'F P' },
    { size: 140, text: 'T O Z' },
    { size: 100, text: 'L P E D' },
    { size: 70, text: 'P E C F D' },
    { size: 50, text: 'E D F C Z P' },
    { size: 36, text: 'F E L O P Z D' },
  ];
  let y = 130;
  for (const r of rows) {
    ctx.font = `bold ${r.size}px Arial, sans-serif`;
    ctx.fillText(r.text, c.width / 2, y);
    y += r.size * 0.9 + 30;
  }
  return c;
}

export function renderFanChart(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  const cx = c.width / 2;
  const cy = c.height / 2;
  const R = 520;
  for (let deg = 0; deg < 180; deg += 10) {
    const a = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  return c;
}

export function renderTextPage(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  const words = 'The quick brown fox jumps over the lazy dog. '.repeat(60).split(' ');
  const sizes = [56, 44, 34, 26, 20, 16];
  let y = 60;
  let wi = 0;
  for (const size of sizes) {
    ctx.font = `${size}px Georgia, serif`;
    const lineH = size * 1.4;
    for (let line = 0; line < 3 && wi < words.length; line++) {
      let text = '';
      while (wi < words.length) {
        const next = text ? text + ' ' + words[wi] : words[wi];
        if (ctx.measureText(next).width > c.width - 120) break;
        text = next;
        wi++;
      }
      ctx.fillText(text, 60, y);
      y += lineH;
    }
    y += 20;
  }
  return c;
}

export const SCENES: Scene[] = [
  { id: 'eye-chart', label: 'Eye chart', render: renderEyeChart },
  { id: 'fan', label: 'Astigmatism dial', render: renderFanChart },
  { id: 'text', label: 'Text', render: renderTextPage },
];
```

- [ ] **Step 2: Write `src/sources/camera.ts`**

```ts
export interface CameraHandle {
  video: HTMLVideoElement;
  stop: () => void;
}

export async function startCamera(
  facingMode: 'environment' | 'user' = 'environment',
): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = stream;
  await video.play();
  return {
    video,
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}
```

- [ ] **Step 3: Write `src/sources/openverse.ts`**

```ts
export interface Photo {
  id: string;
  url: string; // CORS-safe Openverse thumbnail
  creator: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  title: string;
}

const API = 'https://api.openverse.org/v1/images/';

interface OpenverseResult {
  id: string;
  url: string;
  thumbnail?: string;
  creator?: string;
  license: string;
  license_version?: string;
  license_url?: string;
  foreign_landing_url?: string;
  title?: string;
}

interface OpenverseResponse {
  results: OpenverseResult[];
}

const QUERIES = ['landscape', 'street', 'city', 'nature', 'portrait', 'building', 'interior', 'mountain'];

export async function fetchPhotos(query?: string, pageSize = 12): Promise<Photo[]> {
  const q = query ?? QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const params = new URLSearchParams({
    q,
    page_size: String(pageSize),
    license_type: 'all-cc',
    mature: 'false',
  });
  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) throw new Error(`Openverse request failed: ${res.status}`);
  const data = (await res.json()) as OpenverseResponse;
  return data.results.map(toPhoto).filter((p) => !!p.url);
}

function toPhoto(r: OpenverseResult): Photo {
  const license = `CC ${r.license.toUpperCase()}${r.license_version ? ' ' + r.license_version : ''}`;
  return {
    id: r.id,
    url: r.thumbnail || r.url,
    creator: r.creator || 'Unknown',
    license,
    licenseUrl: r.license_url || '',
    sourceUrl: r.foreign_landing_url || r.url,
    title: r.title || 'Untitled',
  };
}
```

- [ ] **Step 4: Write `src/sources/loadImage.ts`**

```ts
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
```

- [ ] **Step 5: Write the tests**

`tests/sources/openverse.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPhotos } from '../../src/sources/openverse';

afterEach(() => vi.restoreAllMocks());

describe('fetchPhotos', () => {
  it('maps Openverse results to Photo with formatted license and thumbnail url', async () => {
    const mockJson = {
      results: [
        {
          id: 'abc',
          url: 'https://example.com/full.jpg',
          thumbnail: 'https://api.openverse.org/v1/images/abc/thumb/',
          creator: 'Jane Doe',
          license: 'by',
          license_version: '4.0',
          license_url: 'https://creativecommons.org/licenses/by/4.0/',
          foreign_landing_url: 'https://example.com/photo',
          title: 'A View',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockJson) }),
    );
    const photos = await fetchPhotos('landscape');
    expect(photos).toHaveLength(1);
    expect(photos[0].url).toBe('https://api.openverse.org/v1/images/abc/thumb/');
    expect(photos[0].creator).toBe('Jane Doe');
    expect(photos[0].license).toBe('CC BY 4.0');
    expect(photos[0].sourceUrl).toBe('https://example.com/photo');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchPhotos('x')).rejects.toThrow('429');
  });
});
```

`tests/sources/scenes.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { SCENES } from '../../src/sources/scenes';

describe('SCENES', () => {
  it('has unique ids and render functions', () => {
    const ids = SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCENES) expect(typeof s.render).toBe('function');
  });
});
```

Note: scene pixel output is not unit-tested (jsdom lacks a 2D canvas backend); it is verified visually in the app.

- [ ] **Step 6: Run tests**

Run: `npm test -- sources`
Expected: PASS (openverse: 2, scenes: 1).

- [ ] **Step 7: Commit**

```bash
git add src/sources tests/sources
git commit -m "feat(sources): procedural scenes, camera, Openverse client, image loader"
```

---

### Task 7: UI — App shell, render loop, canvas, styles

**Files:**
- Create: `src/ui/useLatestRef.ts`, `src/ui/types.ts`
- Modify: `src/App.tsx` (replace placeholder), `src/App.css`
- Test: `tests/ui/useLatestRef.test.tsx`

**Interfaces:**
- Consumes: `VisionRenderer`, `RenderMode`; `selectedEyes`; `SCENES`; `startCamera`, `CameraHandle`; `TOMMY_RX`; `DEFAULT_BLUR_GAIN`.
- Produces:
  - `useLatestRef<T>(v: T): React.MutableRefObject<T>`
  - `SourceKind = 'camera' | 'scene' | 'photo'`
  - A working `App` that renders a full-bleed `<canvas>`, runs a rAF loop, shows the default scene blurred with the author's Rx (both eyes), and shows a WebGL2-unsupported notice when applicable. Later tasks add controls.

- [ ] **Step 1: Write `src/ui/types.ts`**

```ts
export type SourceKind = 'camera' | 'scene' | 'photo';
```

- [ ] **Step 2: Write the failing test for `useLatestRef`**

`tests/ui/useLatestRef.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLatestRef } from '../../src/ui/useLatestRef';

describe('useLatestRef', () => {
  it('tracks the latest value across renders', () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: 1 },
    });
    expect(result.current.current).toBe(1);
    rerender({ v: 2 });
    expect(result.current.current).toBe(2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- useLatestRef`
Expected: FAIL — cannot find module.

- [ ] **Step 4: Write `src/ui/useLatestRef.ts`**

```ts
import { useEffect, useRef } from 'react';

export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- useLatestRef`
Expected: PASS.

- [ ] **Step 6: Replace `src/App.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { VisionRenderer, RenderMode } from './render/VisionRenderer';
import { selectedEyes } from './engine/selectedEyes';
import { SCENES } from './sources/scenes';
import { startCamera, CameraHandle } from './sources/camera';
import { TOMMY_RX } from './optics/presets';
import { DEFAULT_BLUR_GAIN } from './optics/blur';
import { Prescription, EyeSelection } from './optics/types';
import { SourceKind } from './ui/types';
import { useLatestRef } from './ui/useLatestRef';

interface SourceFrame {
  el: TexImageSource;
  w: number;
  h: number;
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<VisionRenderer | null>(null);
  const sourceRef = useRef<SourceFrame | null>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const sceneCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [webglError, setWebglError] = useState(false);
  const [rx] = useState<Prescription>(TOMMY_RX);
  const [selection] = useState<EyeSelection>('both');
  const [mode] = useState<RenderMode>('blurred');
  const [wipe] = useState(0.5);
  const [gain] = useState(DEFAULT_BLUR_GAIN);
  const [kind] = useState<SourceKind>('scene');
  const [sceneId] = useState(SCENES[0].id);

  const rxRef = useLatestRef(rx);
  const selRef = useLatestRef(selection);
  const modeRef = useLatestRef(mode);
  const wipeRef = useLatestRef(wipe);
  const gainRef = useLatestRef(gain);

  // set the active scene as the source
  useEffect(() => {
    if (kind !== 'scene') return;
    let cvs = sceneCache.current.get(sceneId);
    if (!cvs) {
      const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
      cvs = scene.render();
      sceneCache.current.set(sceneId, cvs);
    }
    sourceRef.current = { el: cvs, w: cvs.width, h: cvs.height };
  }, [kind, sceneId]);

  // camera lifecycle
  useEffect(() => {
    if (kind !== 'camera') {
      cameraRef.current?.stop();
      cameraRef.current = null;
      return;
    }
    let cancelled = false;
    startCamera('environment')
      .then((handle) => {
        if (cancelled) {
          handle.stop();
          return;
        }
        cameraRef.current = handle;
        sourceRef.current = {
          el: handle.video,
          w: handle.video.videoWidth || 1280,
          h: handle.video.videoHeight || 720,
        };
      })
      .catch(() => {
        /* fallback handled by controls in later tasks */
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // renderer + rAF loop + resize (mount once)
  useEffect(() => {
    const canvas = canvasRef.current!;
    let renderer: VisionRenderer;
    try {
      renderer = new VisionRenderer(canvas);
    } catch {
      setWebglError(true);
      return;
    }
    rendererRef.current = renderer;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ro = new ResizeObserver(() => {
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));
    });
    ro.observe(canvas);
    canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));

    let raf = 0;
    const loop = () => {
      const src = sourceRef.current;
      if (src && src.w > 0 && src.h > 0) {
        // keep camera dimensions fresh once metadata loads
        if (cameraRef.current && src.el === cameraRef.current.video) {
          src.w = cameraRef.current.video.videoWidth || src.w;
          src.h = cameraRef.current.video.videoHeight || src.h;
        }
        const eyes = selectedEyes(rxRef.current, selRef.current);
        renderer.render(src.el, src.w, src.h, eyes, {
          mode: modeRef.current,
          wipe: wipeRef.current,
          blurGain: gainRef.current,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cameraRef.current?.stop();
      renderer.dispose();
    };
  }, [rxRef, selRef, modeRef, wipeRef, gainRef]);

  if (webglError) {
    return (
      <div className="notice" data-testid="webgl-error">
        <h1>See Through My Eyes</h1>
        <p>Your browser doesn't support WebGL2, which this simulator needs. Try a recent version of Chrome, Safari, Edge, or Firefox.</p>
      </div>
    );
  }

  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" data-testid="stage" />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/App.css`**

```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: #0b0d12;
  color: #f2f4f8;
  overscroll-behavior: none;
}
.app { position: fixed; inset: 0; display: flex; flex-direction: column; }
.stage {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  background: #000;
}
.notice {
  max-width: 32rem;
  margin: 15vh auto;
  padding: 2rem;
  text-align: center;
  line-height: 1.5;
}
.controls {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: linear-gradient(to top, rgba(8,10,14,0.92), rgba(8,10,14,0.55) 70%, transparent);
}
.row { display: flex; gap: 0.5rem; align-items: center; justify-content: center; flex-wrap: wrap; }
.seg { display: inline-flex; border: 1px solid #2a3140; border-radius: 999px; overflow: hidden; background: #131722; }
.seg button {
  border: 0; background: transparent; color: #c9d2e0;
  padding: 0.5rem 0.9rem; font-size: 0.9rem; cursor: pointer; min-width: 44px; min-height: 44px;
}
.seg button[aria-pressed='true'] { background: #3b82f6; color: #fff; }
.btn {
  border: 1px solid #2a3140; background: #131722; color: #eef2f8;
  border-radius: 999px; padding: 0.55rem 1rem; font-size: 0.95rem; cursor: pointer;
  min-height: 44px;
}
.btn.primary { background: #3b82f6; border-color: #3b82f6; }
.attribution {
  position: fixed; left: 0.75rem; top: calc(0.75rem + env(safe-area-inset-top));
  background: rgba(8,10,14,0.7); border: 1px solid #2a3140; border-radius: 0.5rem;
  padding: 0.4rem 0.6rem; font-size: 0.75rem; max-width: 70vw;
}
.attribution a { color: #9ec1ff; }
.toast {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: 8rem; background: #1b2130; border: 1px solid #2a3140;
  padding: 0.6rem 1rem; border-radius: 0.5rem; font-size: 0.85rem;
}
.wipe-handle {
  position: absolute; top: 0; bottom: 0; width: 2px; background: #fff;
  cursor: ew-resize; touch-action: none;
}
.wipe-handle::after {
  content: '↔'; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); background: #fff; color: #111;
  width: 2rem; height: 2rem; border-radius: 999px; display: grid; place-items: center;
}
.rx-panel {
  background: #0f131c; border: 1px solid #2a3140; border-radius: 0.75rem;
  padding: 0.75rem; max-height: 45vh; overflow-y: auto;
}
.rx-panel label { display: flex; flex-direction: column; font-size: 0.75rem; gap: 0.2rem; margin-bottom: 0.5rem; }
.rx-panel input[type='range'] { width: 100%; }
.eye-group { border-top: 1px solid #2a3140; padding-top: 0.5rem; margin-top: 0.5rem; }
```

- [ ] **Step 8: Verify build and app boot**

Run: `npm run typecheck && npm test`
Expected: typecheck passes; all unit tests PASS.
Manual: `npm run dev`, open the URL — the astigmatism dial scene renders heavily blurred (default = author's Rx, both eyes). Resizing the window keeps it full-bleed.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/App.css src/ui/useLatestRef.ts src/ui/types.ts tests/ui/useLatestRef.test.tsx
git commit -m "feat(ui): app shell, WebGL render loop, full-bleed canvas, styles"
```

---

### Task 8: UI — SourceSwitcher, EyeToggle, AttributionChip, photo cycling

**Files:**
- Create: `src/ui/SourceSwitcher.tsx`, `src/ui/EyeToggle.tsx`, `src/ui/AttributionChip.tsx`, `src/ui/Toast.tsx`
- Modify: `src/App.tsx`
- Test: `tests/ui/EyeToggle.test.tsx`, `tests/ui/AttributionChip.test.tsx`

**Interfaces:**
- Consumes: `EyeSelection`; `SourceKind`; `SCENES`; `Photo`, `fetchPhotos`; `loadImage`.
- Produces:
  - `EyeToggle({ value: EyeSelection; onChange: (v: EyeSelection) => void })`
  - `SourceSwitcher({ kind, onKind, sceneId, onScene, onShuffle })`
  - `AttributionChip({ photo: Photo })`
  - `Toast({ message: string | null })`
  - App state now controls source kind, scene id, eye selection, current photo, and photo list cycling.

- [ ] **Step 1: Write the failing test for `EyeToggle`**

`tests/ui/EyeToggle.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EyeToggle } from '../../src/ui/EyeToggle';

describe('EyeToggle', () => {
  it('marks the active option and emits changes', async () => {
    const onChange = vi.fn();
    render(<EyeToggle value="both" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Left' }));
    expect(onChange).toHaveBeenCalledWith('left');
  });
});
```

Note: add `"@testing-library/user-event": "^14.5.2"` to `devDependencies` and `npm install` before running.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- EyeToggle`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `src/ui/EyeToggle.tsx`**

```tsx
import { EyeSelection } from '../optics/types';

const OPTIONS: { value: EyeSelection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'both', label: 'Both' },
  { value: 'right', label: 'Right' },
];

export function EyeToggle({
  value,
  onChange,
}: {
  value: EyeSelection;
  onChange: (v: EyeSelection) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Eye">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- EyeToggle`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `AttributionChip`**

`tests/ui/AttributionChip.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributionChip } from '../../src/ui/AttributionChip';

describe('AttributionChip', () => {
  it('shows creator, license, and a link to the source', () => {
    render(
      <AttributionChip
        photo={{
          id: '1',
          url: 'x',
          creator: 'Jane Doe',
          license: 'CC BY 4.0',
          licenseUrl: 'https://cc/by',
          sourceUrl: 'https://src/photo',
          title: 'A View',
        }}
      />,
    );
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/CC BY 4.0/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view source/i });
    expect(link).toHaveAttribute('href', 'https://src/photo');
  });
});
```

- [ ] **Step 6: Write `src/ui/AttributionChip.tsx`**

```tsx
import { Photo } from '../sources/openverse';

export function AttributionChip({ photo }: { photo: Photo }) {
  return (
    <div className="attribution" data-testid="attribution">
      <div>
        “{photo.title}” by {photo.creator}
      </div>
      <div>
        {photo.license} ·{' '}
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
          view source
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- AttributionChip`
Expected: PASS.

- [ ] **Step 8: Write `src/ui/Toast.tsx`**

```tsx
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" data-testid="toast">
      {message}
    </div>
  );
}
```

- [ ] **Step 9: Write `src/ui/SourceSwitcher.tsx`**

```tsx
import { SCENES } from '../sources/scenes';
import { SourceKind } from './types';

export function SourceSwitcher({
  kind,
  onKind,
  sceneId,
  onScene,
  onShuffle,
}: {
  kind: SourceKind;
  onKind: (k: SourceKind) => void;
  sceneId: string;
  onScene: (id: string) => void;
  onShuffle: () => void;
}) {
  return (
    <div className="row">
      <div className="seg" role="group" aria-label="Source">
        <button aria-pressed={kind === 'camera'} onClick={() => onKind('camera')}>
          Camera
        </button>
        <button aria-pressed={kind === 'scene'} onClick={() => onKind('scene')}>
          Scenes
        </button>
        <button aria-pressed={kind === 'photo'} onClick={() => onKind('photo')}>
          Photos
        </button>
      </div>
      {kind === 'scene' && (
        <div className="seg" role="group" aria-label="Scene">
          {SCENES.map((s) => (
            <button key={s.id} aria-pressed={sceneId === s.id} onClick={() => onScene(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      {kind === 'photo' && (
        <button className="btn" onClick={onShuffle} data-testid="shuffle">
          Next photo →
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Wire into `src/App.tsx`**

Replace the state declarations that were `const [x] = useState(...)` with settable state, add photo state, add the photo effect, and render the controls. Apply these edits:

Change the state block to:
```tsx
  const [webglError, setWebglError] = useState(false);
  const [rx, setRx] = useState<Prescription>(TOMMY_RX);
  const [selection, setSelection] = useState<EyeSelection>('both');
  const [mode, setMode] = useState<RenderMode>('blurred');
  const [wipe, setWipe] = useState(0.5);
  const [gain] = useState(DEFAULT_BLUR_GAIN); // fixed calibration knob, no UI setter
  const [kind, setKind] = useState<SourceKind>('scene');
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
```

Add these imports at the top:
```tsx
import { Photo, fetchPhotos } from './sources/openverse';
import { loadImage } from './sources/loadImage';
import { SourceSwitcher } from './ui/SourceSwitcher';
import { EyeToggle } from './ui/EyeToggle';
import { AttributionChip } from './ui/AttributionChip';
import { Toast } from './ui/Toast';
```

Keep `setRx`, `setMode`, `setWipe`, `setGain` referenced (they are used by later tasks and by the render/controls below) — to avoid `noUnusedLocals` failing before Tasks 9–10, execute Tasks 8–10 as one review batch. EyeToggle consumes `setSelection` and `setKind`/`setSceneId` are consumed by SourceSwitcher in this task; `setMode` and `setWipe` are consumed by Task 9's controls; `setRx` is consumed by Task 10's panel. `gain` has no setter by design (fixed calibration knob). Do NOT add placeholder no-ops to silence the unused-setter errors — implement Tasks 9 and 10 in the same branch, then typecheck.

Update the camera catch to toast + fall back to scene:
```tsx
      .catch(() => {
        setToast('Camera unavailable — showing a scene instead.');
        setKind('scene');
      });
```

Add the photo lifecycle effect (after the camera effect):
```tsx
  // load a batch of photos when entering photo mode or when the batch empties
  useEffect(() => {
    if (kind !== 'photo') return;
    if (photos.length > 0) return;
    let cancelled = false;
    fetchPhotos()
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) throw new Error('empty');
        setPhotos(list);
        setPhotoIndex(0);
      })
      .catch(() => {
        setToast('Could not load photos — showing a scene instead.');
        setKind('scene');
      });
    return () => {
      cancelled = true;
    };
  }, [kind, photos.length]);

  // set the current photo as the source
  useEffect(() => {
    if (kind !== 'photo') return;
    const photo = photos[photoIndex];
    if (!photo) return;
    let cancelled = false;
    loadImage(photo.url)
      .then((img) => {
        if (cancelled) return;
        sourceRef.current = { el: img, w: img.naturalWidth, h: img.naturalHeight };
      })
      .catch(() => setToast('That photo failed to load — try Next.'));
    return () => {
      cancelled = true;
    };
  }, [kind, photos, photoIndex]);
```

Add a shuffle handler (above the return):
```tsx
  const currentPhoto = kind === 'photo' ? photos[photoIndex] : undefined;
  const shuffle = () => {
    if (photoIndex + 1 >= photos.length) setPhotos([]); // triggers a fresh fetch
    else setPhotoIndex((i) => i + 1);
  };
```

Replace the returned JSX (non-error branch) with:
```tsx
  return (
    <div className="app">
      <canvas ref={canvasRef} className="stage" data-testid="stage" />
      {currentPhoto && <AttributionChip photo={currentPhoto} />}
      <Toast message={toast} />
      <div className="controls">
        <SourceSwitcher
          kind={kind}
          onKind={setKind}
          sceneId={sceneId}
          onScene={setSceneId}
          onShuffle={shuffle}
        />
        <div className="row">
          <EyeToggle value={selection} onChange={setSelection} />
          {selection === 'both' && (
            <span className="hint" data-testid="both-hint">
              “Both” is an approximate blend of the two eyes
            </span>
          )}
        </div>
      </div>
    </div>
  );
```

Add a `.hint` style to `src/App.css`:
```css
.hint { font-size: 0.7rem; color: #8b95a7; }
```

Auto-dismiss toast (add effect):
```tsx
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);
```

- [ ] **Step 11: Run tests + typecheck**

Run: `npm test && npm run typecheck`
Expected: unit tests PASS. Typecheck may report unused `setRx/setMode/setWipe` — these are consumed in Tasks 9–10; execute this task together with Tasks 9 and 10 before a clean typecheck (see note in Step 10).

- [ ] **Step 12: Commit (after Tasks 9–10 if batching)**

```bash
git add src/ui/SourceSwitcher.tsx src/ui/EyeToggle.tsx src/ui/AttributionChip.tsx src/ui/Toast.tsx src/App.tsx tests/ui/EyeToggle.test.tsx tests/ui/AttributionChip.test.tsx
git commit -m "feat(ui): source switcher, eye toggle, attribution chip, photo cycling"
```

---

### Task 9: UI — CorrectionControls (toggle + wipe)

**Files:**
- Create: `src/ui/CorrectionControls.tsx`, `src/ui/WipeHandle.tsx`
- Modify: `src/App.tsx`
- Test: `tests/ui/CorrectionControls.test.tsx`

**Interfaces:**
- Consumes: `RenderMode`.
- Produces:
  - `CorrectionControls({ mode, onMode })` — buttons for glasses on (`sharp`), off (`blurred`), and compare (`wipe`).
  - `WipeHandle({ value, onChange })` — a draggable vertical handle (pointer + touch) over the stage that reports a 0..1 position; rendered only in `wipe` mode.

- [ ] **Step 1: Write the failing test for `CorrectionControls`**

`tests/ui/CorrectionControls.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CorrectionControls } from '../../src/ui/CorrectionControls';

describe('CorrectionControls', () => {
  it('emits mode changes and marks the active mode', async () => {
    const onMode = vi.fn();
    render(<CorrectionControls mode="blurred" onMode={onMode} />);
    expect(screen.getByRole('button', { name: /without glasses/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /with glasses/i }));
    expect(onMode).toHaveBeenCalledWith('sharp');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    expect(onMode).toHaveBeenCalledWith('wipe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CorrectionControls`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `src/ui/CorrectionControls.tsx`**

```tsx
import { RenderMode } from '../render/VisionRenderer';

const OPTIONS: { value: RenderMode; label: string }[] = [
  { value: 'sharp', label: 'With glasses' },
  { value: 'blurred', label: 'Without glasses' },
  { value: 'wipe', label: 'Compare' },
];

export function CorrectionControls({
  mode,
  onMode,
}: {
  mode: RenderMode;
  onMode: (m: RenderMode) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Correction">
      {OPTIONS.map((o) => (
        <button key={o.value} aria-pressed={mode === o.value} onClick={() => onMode(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- CorrectionControls`
Expected: PASS.

- [ ] **Step 5: Write `src/ui/WipeHandle.tsx`**

```tsx
import { useRef } from 'react';

export function WipeHandle({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = (clientX - rect.left) / rect.width;
    onChange(Math.min(1, Math.max(0, v)));
  };

  return (
    <div
      ref={trackRef}
      className="wipe-track"
      style={{ position: 'absolute', inset: 0 }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) setFromClientX(e.clientX);
      }}
    >
      <div
        className="wipe-handle"
        data-testid="wipe-handle"
        style={{ left: `calc(${value * 100}% - 1px)` }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Wire into `src/App.tsx`**

Add imports:
```tsx
import { CorrectionControls } from './ui/CorrectionControls';
import { WipeHandle } from './ui/WipeHandle';
```

Add the wipe overlay inside `.app`, right after the `<canvas>`:
```tsx
      {mode === 'wipe' && <WipeHandle value={wipe} onChange={setWipe} />}
```

Add the correction row inside `.controls`, after the eye-toggle row:
```tsx
        <div className="row">
          <CorrectionControls mode={mode} onMode={setMode} />
        </div>
```

- [ ] **Step 7: Run tests**

Run: `npm test -- CorrectionControls`
Expected: PASS.
Manual (after Task 10 batch): in the app, "Without glasses" shows blur, "With glasses" shows sharp, "Compare" shows a draggable boundary — sharp left, blur right.

- [ ] **Step 8: Commit (or include in the 8–10 batch)**

```bash
git add src/ui/CorrectionControls.tsx src/ui/WipeHandle.tsx src/App.tsx tests/ui/CorrectionControls.test.tsx
git commit -m "feat(ui): correction mode controls and draggable wipe compare"
```

---

### Task 10: UI — RxPanel (presets + per-eye sliders)

**Files:**
- Create: `src/ui/RxPanel.tsx`
- Modify: `src/App.tsx`
- Test: `tests/ui/RxPanel.test.tsx`

**Interfaces:**
- Consumes: `Prescription`, `EyeRx`; `PRESETS`, `Preset`.
- Produces: `RxPanel({ rx, onRx, open, onToggle })` — a collapsible panel with preset buttons and per-eye SPH/CYL/axis sliders; changing a preset or slider calls `onRx` with a new `Prescription`.

- [ ] **Step 1: Write the failing test for `RxPanel`**

`tests/ui/RxPanel.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxPanel } from '../../src/ui/RxPanel';
import { TOMMY_RX } from '../../src/optics/presets';

describe('RxPanel', () => {
  it('applies a preset when its button is clicked', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} open onToggle={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /^Mild$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
    const applied = onRx.mock.calls[0][0];
    expect(applied.right.sph).toBe(-1.0);
  });

  it('updates a single field from a slider without mutating others', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} open onToggle={() => {}} />);
    const slider = screen.getByLabelText(/right sphere/i);
    slider.focus();
    // jsdom: set value + fire change
    (slider as HTMLInputElement).value = '-10';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onRx).toHaveBeenCalled();
    const applied = onRx.mock.calls.at(-1)![0];
    expect(applied.right.sph).toBeCloseTo(-10);
    expect(applied.left.sph).toBe(TOMMY_RX.left.sph);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- RxPanel`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `src/ui/RxPanel.tsx`**

```tsx
import { Prescription, EyeRx } from '../optics/types';
import { PRESETS } from '../optics/presets';

type EyeKey = 'right' | 'left';
type Field = keyof EyeRx;

function EyeSliders({
  eyeKey,
  label,
  eye,
  onField,
}: {
  eyeKey: EyeKey;
  label: string;
  eye: EyeRx;
  onField: (eyeKey: EyeKey, field: Field, value: number) => void;
}) {
  return (
    <div className="eye-group">
      <strong>{label}</strong>
      <label>
        {label} sphere: {eye.sph.toFixed(2)} D
        <input
          type="range"
          min={-20}
          max={0}
          step={0.25}
          value={eye.sph}
          onChange={(e) => onField(eyeKey, 'sph', parseFloat(e.target.value))}
        />
      </label>
      <label>
        {label} cylinder: {eye.cyl.toFixed(2)} D
        <input
          type="range"
          min={-6}
          max={0}
          step={0.25}
          value={eye.cyl}
          onChange={(e) => onField(eyeKey, 'cyl', parseFloat(e.target.value))}
        />
      </label>
      <label>
        {label} axis: {eye.axis}°
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={eye.axis}
          onChange={(e) => onField(eyeKey, 'axis', parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
}

export function RxPanel({
  rx,
  onRx,
  open,
  onToggle,
}: {
  rx: Prescription;
  onRx: (rx: Prescription) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const onField = (eyeKey: EyeKey, field: Field, value: number) => {
    onRx({ ...rx, [eyeKey]: { ...rx[eyeKey], [field]: value } });
  };

  return (
    <div>
      <div className="row">
        <button className="btn" onClick={onToggle} aria-expanded={open}>
          {open ? 'Hide prescription ▾' : 'Adjust prescription ▸'}
        </button>
      </div>
      {open && (
        <div className="rx-panel" data-testid="rx-panel">
          <div className="row">
            {PRESETS.map((p) => (
              <button key={p.id} className="btn" onClick={() => onRx(p.rx)}>
                {p.label}
              </button>
            ))}
          </div>
          <EyeSliders eyeKey="right" label="Right" eye={rx.right} onField={onField} />
          <EyeSliders eyeKey="left" label="Left" eye={rx.left} onField={onField} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- RxPanel`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire into `src/App.tsx`**

Add import + a panel-open state and render it in the controls:
```tsx
import { RxPanel } from './ui/RxPanel';
```

Add state near the others:
```tsx
  const [rxOpen, setRxOpen] = useState(false);
```

Add to `.controls` (below the correction row):
```tsx
        <RxPanel rx={rx} onRx={setRx} open={rxOpen} onToggle={() => setRxOpen((o) => !o)} />
```

This consumes `setRx` and closes the `noUnusedLocals` gap from Task 8.

- [ ] **Step 6: Run full unit suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all unit tests PASS; typecheck clean (all setters now consumed).

- [ ] **Step 7: Commit**

```bash
git add src/ui/RxPanel.tsx src/App.tsx tests/ui/RxPanel.test.tsx
git commit -m "feat(ui): adjustable prescription panel with presets and per-eye sliders"
```

---

### Task 11: E2E — Playwright flows

**Files:**
- Create: `tests/e2e/flows.spec.ts`

**Interfaces:**
- Consumes: the built app served by Playwright's `webServer`.
- Produces: DOM-level coverage of source switching, correction toggle, camera-denied fallback, and photo attribution (with network + image stubbed).

- [ ] **Step 1: Write the E2E spec**

`tests/e2e/flows.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

// 1x1 transparent PNG data URI so stubbed photos load without network/CORS.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('renders the stage and switches correction modes', async ({ page }) => {
  await page.goto('/');
  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);

  await page.getByRole('button', { name: /with glasses/i }).click();
  await expect(page.getByRole('button', { name: /with glasses/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /compare/i }).click();
  await expect(page.getByTestId('wipe-handle')).toBeVisible();
});

test('falls back to a scene when the camera is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Camera' }).click();
  await expect(page.getByTestId('toast')).toContainText(/camera unavailable/i);
  await expect(page.getByRole('button', { name: 'Scenes' })).toHaveAttribute('aria-pressed', 'true');
});

test('shows attribution for a stubbed Openverse photo', async ({ page }) => {
  await page.route('**/api.openverse.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: '1',
            url: PNG,
            thumbnail: PNG,
            creator: 'Jane Doe',
            license: 'by',
            license_version: '4.0',
            license_url: 'https://cc/by',
            foreign_landing_url: 'https://src/photo',
            title: 'A View',
          },
        ],
      }),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Photos' }).click();
  await expect(page.getByTestId('attribution')).toContainText('Jane Doe');
  await expect(page.getByTestId('attribution')).toContainText('CC BY 4.0');
});
```

Note: if the base64 PNG above is rejected by the browser as malformed, regenerate a valid 1×1 PNG data URI (e.g. `node -e "const c=require('crypto');..."` is unnecessary — use any known-good 1×1 transparent PNG data URI) and paste it in place. The string must decode to a valid image.

- [ ] **Step 2: Install browsers and run E2E**

Run: `npx playwright install chromium && npm run test:e2e`
Expected: 3 tests PASS. (The first run builds and previews via the configured `webServer`.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/flows.spec.ts
git commit -m "test(e2e): source switching, correction toggle, camera fallback, attribution"
```

---

### Task 12: Build verification, README, Netlify deploy

**Files:**
- Create: `README.md`
- Verify: `dist/` builds; Netlify config from Task 1.

- [ ] **Step 1: Write `README.md`**

````markdown
# See Through My Eyes — Vision Simulator

A web app that simulates severe myopia with astigmatism in real time — applied to your camera, built-in scenes, or infinite Creative Commons photos. Flip between "with glasses" and "without" to feel the difference.

Defaults to the author's prescription (OD −13.25 / −3.25 × 5, OS −15.00 / −1.25 × 180) and lets anyone dial in their own.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test            # unit (Vitest)
npm run test:e2e    # end-to-end (Playwright)
npm run typecheck
```

## Build & deploy

```bash
npm run build       # -> dist/
```

Deploys static to Netlify (`netlify.toml` included: publish `dist`, SPA redirect). No backend, no API keys.

## How it works

- `src/optics` turns a prescription into an oriented elliptical blur (two principal meridians: SPH at the axis, SPH+CYL at axis+90°).
- `src/render/VisionRenderer.ts` (WebGL2) applies a two-pass separable directional blur along those meridians, in real time.
- Photos come from the keyless, CORS-friendly [Openverse](https://openverse.org) API, with attribution shown on screen.

## Accuracy

This is a physically-grounded approximation for empathy and illustration, not a medical instrument. It models the distance-viewing worst case and has a single calibration constant (`DEFAULT_BLUR_GAIN`) tuned by eye. "Both eyes" blends the two per-eye renders as an approximation of binocular fusion.

## Image credits

Photos are Creative Commons works surfaced via Openverse; each image shows its creator, license, and a link to the original source.
````

- [ ] **Step 2: Verify production build**

Run: `npm run build`
Expected: `tsc -b` passes and Vite writes `dist/` with no errors.

- [ ] **Step 3: Verify the built app locally**

Run: `npm run preview`
Manual: open the preview URL; confirm the scene renders blurred, controls work, and no console errors.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README; verify production build and Netlify config"
```

- [ ] **Step 5: Deploy (author action)**

Connect the repo to Netlify (or `npx netlify deploy --prod --dir=dist`). Build command `npm run build`, publish directory `dist`. Camera requires HTTPS — Netlify provides it.

---

## Calibration follow-up (post-implementation, author-in-the-loop)

Once the app runs, the author should compare the default preset against their real uncorrected vision and adjust `DEFAULT_BLUR_GAIN` in `src/optics/blur.ts` up or down until it matches. This is the fidelity loop the spec calls out; it is expected to need one or two tweaks and is not a code defect.
