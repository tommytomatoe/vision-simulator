# Vision Simulator — Design Spec

**Date:** 2026-07-08
**Status:** Approved, ready for implementation planning

## Purpose

A web app that lets someone experience severe myopia with astigmatism — specifically the author's prescription — by applying a physically-grounded vision simulation to a live camera feed, built-in scenes, or an infinite stream of Creative Commons photos. The goal is empathy: "here, this is what I see."

The emotional core is the corrected-vs-uncorrected comparison: the sharp world snapping into the author's blur and back.

## Reference prescription (the default / hero)

| Eye | SPH | CYL | Axis |
|-----|-----|-----|------|
| OD (Right) | −13.25 | −3.25 | 5° |
| OS (Left)  | −15.00 | −1.25 | 180° |

## Scope

**In scope (v1):**
- Live camera, built-in scenes, and Openverse (Creative Commons) infinite photo cycling as image sources.
- Adjustable prescription (per-eye SPH / CYL / axis) with friendly presets; opens on the author's Rx.
- Per-eye view toggle: Left / Both / Right (defaults Both).
- Corrected-vs-uncorrected comparison via a full-screen toggle and a draggable wipe handle.
- Physically-grounded elliptical (astigmatic) blur, rendered in real time via WebGL2.
- Mobile-first, thumb-friendly, responsive.
- Static deploy to Netlify — no backend.

**Out of scope (v1 / YAGNI):**
- Viewing-distance slider (v1 models the distance-viewing worst case only).
- Higher-order optical effects beyond defocus + astigmatism (e.g. minification, contrast loss, glare/halos).
- Unsplash integration / any secret-keyed API / serverless functions.
- Accounts, saving, sharing of specific configurations via URL (could come later).

## Architecture

Vite + TypeScript + React, deployed static to Netlify. React handles UI state only. The vision simulation is a framework-agnostic WebGL2 module so it stays fast and independently testable.

Four well-bounded units:

### 1. `optics` — pure functions, no rendering
The "physics." Converts a prescription into blur parameters. Fully unit-testable.

- Each eye splits into two principal meridians. Power at the axis angle = SPH; power 90° from the axis = SPH + CYL.
  - Right eye: −13.25 @ 5°, −16.50 @ 95°
  - Left eye: −15.00 @ 0/180°, −16.25 @ 90°
- Each meridian's dioptric defocus maps to a blur magnitude (larger diopters → larger blur), yielding an **oriented elliptical blur** rather than a symmetric Gaussian. This directional smear is what reads as astigmatism.
- Model assumption: displayed content represents the **distance-viewing worst case** (full refractive error applies). One tuning constant (assumed field-of-view / pupil diameter) calibrates the mapping so the default preset matches the author's actual experience. The author is the fidelity ground truth.

Output per eye: two blur sigmas (in the rendered pipeline's units) and a rotation angle.

### 2. `VisionRenderer` — WebGL2
Takes a live source (video or image) + optics params and renders the blurred result to a canvas in real time.

Per-frame pipeline:
- Source → texture.
- **Two-pass separable blur along the eye's two rotated principal meridians** (sigma1 along meridian 1, sigma2 along meridian 2). Separating along the ellipse's own axes is exact and cheap.
- **Downsample before blurring** and use linear-sampled taps to keep tap counts manageable at severe blur levels. Adaptively reduce internal resolution if a device struggles, to hold interactive frame rates.
- **Eye toggle:** render the selected eye's params. "Both" blends the two eyes' outputs — a reasonable approximation of binocular fusion, labeled in-app as an approximation.
- **Correction toggle + wipe:** keep both the sharp source and the blurred result available; the toggle shows one full-screen, the wipe composites sharp / blurred at a draggable boundary.

### 3. `sources`
- Camera via `getUserMedia` (rear-facing default on mobile).
- Bundled built-in scenes (a curated handful that demonstrate the effect well).
- Openverse client: fetch CC images + attribution data (creator, license, source URL). Keyless, CORS-friendly, client-side.

### 4. `ui` — React
Controls and state wiring; drives the renderer.

## UX & layout (mobile-first)

- Full-bleed canvas is the star. Controls in a bottom bar, reachable one-handed on a phone.
- **Source switcher:** Camera · Scenes · Photos, with shuffle/"next" for infinite Openverse cycling.
- **Eye segmented control:** L · Both · R (defaults Both).
- **Correction:** prominent "glasses on/off" toggle + draggable wipe handle on the image.
- **Adjust Rx panel** (collapsed by default): presets — Mild · Moderate · Tommy's eyes (−13/−14) · Legally blind — plus per-eye SPH / CYL / axis sliders. Opens on the author's prescription.
- **Attribution overlay:** when an Openverse photo shows, a small always-visible credit chip (photographer · license · link) that opens the source.

## Error handling / graceful degradation

- Camera denied or absent → fall back to Scenes with a friendly inline message.
- Openverse fetch fails / offline → fall back to bundled scenes with a small toast.
- No WebGL2 support → a clear notice rather than a blank screen.

## Testing

- `optics` pure functions: real unit tests (prescription → meridian powers, sigmas, angle). The correctness-critical core.
- `VisionRenderer`: smoke test (renders non-blank output, responds to param changes).
- Playwright flows: source switching, correction toggle, camera-denied fallback.
- Visual fidelity: verified by the author eyeballing against real vision — the calibration loop.
