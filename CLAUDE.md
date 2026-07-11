# Vision Simulator — project notes

A static Vite + React + TypeScript app that simulates severe myopia + astigmatism
(WebGL2) applied to a live camera, the eye chart, or a bundled set of photos.
Deploys static to Netlify (auto-builds from GitHub `main`).

## Photos pipeline

Photo mode cycles a **curated, bundled Unsplash set** — not a live API. To
add, remove, or swap photos:

1. Drop the full-resolution Unsplash originals into `photos/` (this folder's
   `*.jpg` are gitignored; only `photos.txt` and the optimized copies are
   committed).
2. Add one credit line per photo to `photos/photos.txt`, in the exact format
   Unsplash's "copy credit" gives:
   `Photo by <a href="CREATOR_URL">Name</a> on <a href="PHOTO_URL">Unsplash</a>`
   (the photo is matched to its credit by the Unsplash ID — the trailing 11
   chars of the photo-URL slug; IDs may contain `-`).
3. Run the optimizer:
   ```
   node scripts/build-photos.mjs
   ```
   It resizes each original (macOS `sips`: max 1600px long edge, JPEG q80),
   writes `public/photos/<id>.jpg`, and regenerates `src/sources/localPhotos.ts`.
   `public/photos/` is wiped and rebuilt each run.
4. Commit `photos/photos.txt`, `public/photos/`, and `src/sources/localPhotos.ts`.

`src/sources/localPhotos.ts` is **auto-generated — do not edit by hand.**
`src/sources/photos.ts` wraps it with `shuffledPhotos()`; the app shuffles the
set on entering photo mode and reshuffles after the last photo. Attribution is
the required "Photo by <creator> on Unsplash" (both links).

## Analytics

Google Analytics is injected at **build time only when the `VITE_GA_ID` env var
is set** (plugin in `vite.config.ts`). The measurement ID is deliberately NOT
committed — it lives in Netlify (Site configuration → Environment variables →
`VITE_GA_ID`). Local dev/test builds therefore send no analytics at all.

Events go through `track()` in `src/analytics.ts` (a safe no-op when GA is
absent). The event taxonomy is documented in that file's header — keep params
low-cardinality and never send user-entered prescription values (preset ids and
facts-of-use only).

## Commands

- `npm run dev` — dev server (has React StrictMode; see the context-loss note below)
- `npm test` — unit (Vitest) · `npm run test:e2e` — Playwright (builds + serves preview and dev)
- `npm run typecheck` · `npm run build` (→ `dist/`)

## Gotchas / decisions

- **Blur calibration**: one knob, `DEFAULT_BLUR_GAIN` in `src/optics/blur.ts`
  (currently `0.0018`, tuned by eye). Override at runtime with `?gain=` for
  re-tuning.
- **WebGL2 context on dispose**: `VisionRenderer.dispose()` must NOT call
  `loseContext()` — under StrictMode's double-mount it poisons the canvas and
  shows a false "no WebGL2" notice. It frees GL objects instead.
- **Renderer works at ≤900px internally** (`MAX_INTERNAL`), so source photos
  beyond ~1600px add little; that's why 1600px is the optimize target.
- Optics/engine/render/sources logic is decoupled from React; UI lives in
  `src/ui/` with a warm light theme (no dark mode) in `src/App.css`.
