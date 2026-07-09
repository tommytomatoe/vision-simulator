# Vision Simulator — UI Redesign Design Spec

**Date:** 2026-07-09
**Status:** Approved, ready for implementation planning
**Supersedes:** the UI/layout portions of `2026-07-08-vision-simulator-design.md` (the engine, optics, sources, and renderer are unchanged).

## Purpose

Reskin the Vision Simulator into a modern, immersive photo-app experience — inspired by the "Glimpse" social-app concept the author selected. The image is the hero; controls float over it. The three correction modes are the only always-visible primary actions; everything else lives in a settings bottom sheet.

This is a presentation-layer redesign. The WebGL renderer, optics, `sources`, and `engine` modules do not change — only how the app is laid out, styled, and how controls are organized.

## Visual identity

A single, deliberately committed **warm light** theme (no dark mode — this is a design choice, not an omission).

**Palette (CSS custom properties):**
- `--espresso: #37291D` — the one bold color: active states, Next button, Done button
- `--ink: #2C2118` — primary text
- `--muted: #8B8076` — secondary text, labels
- `--cream: #FBF8F4` — settings sheet surface
- `--surface: #F1EBE3` — inactive pills/chips inside the sheet
- `--line: rgba(44, 33, 24, 0.10)` — hairlines
- `--chrome: rgba(255, 255, 255, 0.94)` — floating chrome over the image (chips, gear, action bar)
- The image/canvas sits on black (`#000`) so full-bleed photos and letterboxing look intentional.

**Typography:** a warm humanist system stack for v1 (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Personality comes from color, generous rounding, and spacing rather than a custom face. Inlining an open-licensed rounded display face is a possible fast-follow, explicitly out of scope here.

**Icons:** [Lucide](https://lucide.dev) (ISC license), inline as SVG components — no CDN, no runtime dependency. Icon set used: `camera`, `shapes` (scenes), `image` (photos), `settings` (cog), `chevron-right` (next / expander), `chevron-down` (chip), `x` (close, optional). Stroke `currentColor`, width 2, round caps.

**Shape & depth:** pills at `999px`; sheet corners `26px`; inner controls `13–15px`; soft warm shadows. Large radii and pill controls throughout.

## Layout — main screen (immersive)

The WebGL `<canvas>` fills the viewport (full-bleed, as today). Floating chrome overlays it:

- **Top-left — source chip:** Lucide icon + current source label + chevron (e.g. "Photos ⌄"). Tapping opens the settings sheet. Shows at-a-glance what you're looking at.
- **Top-right — gear button:** circular, opens the settings sheet.
- **Bottom-center — action bar:** a compact, centered floating white pill with three buttons: **With glasses · Without · Compare**. Active button filled espresso. This is the primary control. Default active = **With glasses** (sharp) — a change from the current default of Without/blurred.
- **Bottom-right — Next button:** floating circular espresso button with a chevron. **Visible only when source = Photos.** Advances to the next photo (existing shuffled-pool logic).
- **Caption (bottom-left, above the bar):** for photos, attribution styled as `@creator · title · license` with the source link — always shown for Openverse photos (attribution is required). For scenes, the scene name; for camera, a subtle "Live camera" or nothing.
- **Compare mode:** the existing draggable wipe handle appears over the image, restyled to the warm palette.
- All chrome respects `env(safe-area-inset-*)`.

## Settings sheet

A bottom sheet that slides up from the gear/chip over a dimmed scrim. Dismiss by tapping the scrim, pressing **Done**, or swiping the handle down. Contains, top to bottom:

1. **Drag handle.**
2. **Source** — three pills with Lucide icons: Camera / Scenes / Photos.
3. **Scene sub-picker** — Eye chart / Astigmatism dial / Text — shown **only when Source = Scenes**.
4. **Eyes** — Left / Both / Right (default Both) + the "'Both' is an approximate blend" hint.
5. **Prescription** — preset chips (20/20, 20/40, 20/70, 20/100, 20/200 · Legally blind, Tommy's eyes) with the active preset filled espresso; then a **"Fine-tune each eye"** expander row that reveals the per-eye SPH/CYL/axis sliders (collapsed by default to keep the sheet calm).
6. **Done** button (espresso, full width).

The sheet scrolls if its content exceeds the available height.

## Behavior changes from the current UI

- Default correction mode: **`sharp` (With glasses)** instead of `blurred`.
- The always-visible stacked control bar is removed. Only the three correction buttons remain on the main screen (restyled as the floating action bar).
- Source switching, scene selection, eye selection, and the prescription controls all move into the settings sheet.
- "Next photo" becomes the floating Next button, shown only in photo mode.
- Attribution is restyled as a caption but remains always-visible for photos.

## Component / file changes

Unchanged: `src/optics/*`, `src/engine/*`, `src/render/*`, `src/sources/*` (logic), `parseGainParam`, calibration.

- **New** `src/ui/icons.tsx` — small set of Lucide inline-SVG icon components.
- **New** `src/ui/SettingsSheet.tsx` — the bottom sheet; composes source, scene sub-picker, eye, and prescription controls; open/close + scrim + Done.
- **New** `src/ui/SourceChip.tsx` — top-left source indicator/button.
- **New** `src/ui/IconButton.tsx` — the circular gear/Next buttons (shared).
- **Restyle / repurpose:**
  - `CorrectionControls.tsx` → the compact floating **action bar** (same three modes; new styling; may rename to `ActionBar.tsx`).
  - `SourceSwitcher.tsx` → source + scene controls now rendered **inside the sheet** (main-screen role replaced by `SourceChip`).
  - `EyeToggle.tsx` → rendered inside the sheet (restyled).
  - `RxPanel.tsx` → rendered inside the sheet; presets as chips, sliders behind the "Fine-tune each eye" expander (restyled; the expander behavior already exists).
  - `AttributionChip.tsx` → restyled as the caption.
  - `Toast.tsx` → restyled, unchanged behavior.
- **`App.tsx`** — add `settingsOpen` state; wire chip + gear to open the sheet; move controls into the sheet; change default correction mode to `sharp`.
- **`App.css`** — replace the dark/blue theme with the warm light token set and the new component styles.

## Accessibility

- All controls keyboard-focusable with a visible focus state.
- `aria-pressed` on the toggle buttons (action bar, eye, source, presets); `aria-expanded` on the sheet trigger and the "Fine-tune" expander; the sheet is a labeled dialog.
- Minimum 44px touch targets — including the prescription sliders (this fixes the sub-44px slider gap flagged in the earlier review).
- Sheet slide and wipe transitions respect `prefers-reduced-motion`.

## Testing

- **Component (RTL/Vitest):** action bar (mode change, default `sharp`); `SettingsSheet` (opens/closes, source switch, scene sub-picker appears only under Scenes, eye toggle, preset applies, expander reveals sliders); `SourceChip` (opens the sheet); Next button (rendered only for photos; advances).
- **Unchanged:** optics, engine, sources, renderer guard, parseGainParam tests.
- **E2E (Playwright):** update `flows.spec.ts` for the new structure — correction modes via the action bar, opening settings, switching source, camera-denied fallback, attribution caption. Keep the dev/StrictMode regression test.
- **Visual:** the approved companion mockups (`.superpowers/brainstorm/…`) are the reference; final look verified by the author in-browser.

## Out of scope (YAGNI)

- Dark mode.
- Swipe-to-advance / a scrollable photo feed (Next is a button in this design; swipe can be a later enhancement).
- Social-app trappings (stories row, likes/comments/share) — this isn't a real social network.
- Inlining a custom webfont (system stack for v1).
