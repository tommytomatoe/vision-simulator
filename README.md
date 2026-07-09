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

To re-tune the blur, append `?gain=` to the URL (e.g. `?gain=0.0025`) to override the constant at runtime, compare against real vision, then set the value you like in `src/optics/blur.ts`.

## Image credits

Photos are Creative Commons works surfaced via Openverse; each image shows its creator, license, and a link to the original source.
