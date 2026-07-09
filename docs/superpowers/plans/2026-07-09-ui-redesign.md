# Vision Simulator UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the Vision Simulator into an immersive, warm, photo-app UI — full-bleed image, a compact floating action bar (With glasses / Without / Compare) as the only primary control, and everything else in a warm settings bottom sheet.

**Architecture:** Presentation-layer only. The WebGL renderer, `optics`, `engine`, and `sources` logic are untouched. We restyle existing UI components, add a few new ones (icons, settings sheet, chrome buttons), and rewrite `App.tsx`'s render tree and `App.css`. Behavior is preserved except the default correction mode changes to "With glasses" (sharp).

**Tech Stack:** React 18 + TypeScript, Vitest + React Testing Library, Playwright, plain CSS (single `App.css`), Lucide icon paths inlined as SVG (no CDN).

## Global Constraints

- TypeScript `strict`; no `any`; prefer `import type` for type-only imports.
- Single **warm light** theme, no dark mode. Palette (CSS custom properties on `:root`):
  - `--espresso: #37291D` (the one bold color: active states, Next, Done)
  - `--ink: #2C2118`; `--muted: #8B8076`; `--cream: #FBF8F4`; `--surface: #F1EBE3`; `--line: rgba(44,33,24,0.10)`; `--chrome: rgba(255,255,255,0.94)`
  - Canvas ground is black (`#000`).
- Typeface: system stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No webfont.
- Icons: Lucide paths (ISC license) inlined as SVG components, `stroke="currentColor"`, `stroke-width="2"`, round caps, `fill="none"`, `aria-hidden`.
- Correction labels (exact): **"With glasses"** (mode `sharp`), **"Without"** (mode `blurred`), **"Compare"** (mode `wipe`).
- Default correction mode: **`sharp`**. Default eye selection: `both`. Default source: `scene`.
- Attribution caption always shown for photos (creator · title · license + source link).
- Minimum 44px touch targets on all interactive controls, including prescription sliders.
- Transitions respect `prefers-reduced-motion`.
- Keep all existing non-UI tests passing (optics, engine, renderer guard, sources, parseGainParam).

## File Structure

New:
- `src/ui/icons.tsx` — Lucide inline-SVG icon components.
- `src/ui/IconButton.tsx` — circular chrome button (gear).
- `src/ui/SourceChip.tsx` — top-left source indicator/button.
- `src/ui/NextButton.tsx` — floating espresso Next button (photos only).
- `src/ui/SettingsSheet.tsx` — the warm bottom sheet composing source/scene/eye/prescription controls.

Restyled in place (names kept to avoid churn):
- `src/ui/CorrectionControls.tsx` — becomes the floating action bar (new labels/classes).
- `src/ui/EyeToggle.tsx` — restyled to `.seg`, used inside the sheet.
- `src/ui/RxPanel.tsx` — presets as chips + self-managed "Fine-tune each eye" expander revealing sliders; used inside the sheet.
- `src/ui/AttributionChip.tsx` — restyled as `.caption`.
- `src/ui/Toast.tsx`, `src/ui/WipeHandle.tsx` — restyled via CSS.

Rewritten:
- `src/App.tsx` — new render tree, `settingsOpen` state, default mode `sharp`.
- `src/App.css` — warm theme tokens + all component/layout styles.

Deleted:
- `src/ui/SourceSwitcher.tsx` — its source + scene controls move into `SettingsSheet` (no separate test file exists for it).

CSS ownership: each component task appends its **appearance** CSS to `App.css`; the App-integration task owns **layout/placement** CSS. Class names are namespaced to avoid cascade collisions (see each task).

---

### Task 1: Icons module

**Files:**
- Create: `src/ui/icons.tsx`
- Test: `tests/ui/icons.test.tsx`

**Interfaces:**
- Produces: `CameraIcon`, `ShapesIcon`, `ImageIcon`, `SettingsIcon`, `ChevronRight`, `ChevronDown` — each `(props: { size?: number; className?: string }) => JSX.Element` rendering an `<svg role="img" aria-hidden="true">` with `stroke="currentColor"`.

- [ ] **Step 1: Write the failing test**

`tests/ui/icons.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CameraIcon, ShapesIcon, ImageIcon, SettingsIcon, ChevronRight, ChevronDown } from '../../src/ui/icons';

describe('icons', () => {
  it('render as sized svg elements using currentColor', () => {
    for (const Icon of [CameraIcon, ShapesIcon, ImageIcon, SettingsIcon, ChevronRight, ChevronDown]) {
      const { container } = render(<Icon size={20} />);
      const svg = container.querySelector('svg')!;
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('width')).toBe('20');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- icons`
Expected: FAIL — cannot find module `icons`.

- [ ] **Step 3: Write `src/ui/icons.tsx`**

```tsx
import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 18, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      role="img"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </Svg>
  );
}

export function ShapesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- icons`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/icons.tsx tests/ui/icons.test.tsx
git commit -m "feat(ui): Lucide inline-SVG icon components"
```

---

### Task 2: Warm theme foundation (App.css)

**Files:**
- Modify: `src/App.css` (full rewrite of theme + base; component sections appended by later tasks)

**Interfaces:**
- Produces: `:root` warm token set; base styles for `body`, `.app`, `.stage`, `.notice`. Later tasks append `.action-bar`, `.source-chip`, `.icon-btn`, `.next-btn`, `.sheet*`, `.seg`, `.caption`, layout placement, etc.

- [ ] **Step 1: Replace `src/App.css` with the warm foundation**

```css
:root {
  --espresso: #37291D;
  --ink: #2C2118;
  --muted: #8B8076;
  --cream: #FBF8F4;
  --surface: #F1EBE3;
  --line: rgba(44, 33, 24, 0.10);
  --chrome: rgba(255, 255, 255, 0.94);
  --chrome-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; }
body {
  font-family: var(--sans);
  background: #000;
  color: var(--ink);
  overscroll-behavior: none;
  -webkit-font-smoothing: antialiased;
}

.app { position: fixed; inset: 0; overflow: hidden; background: #000; }
.stage {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
  touch-action: none;
  background: #000;
}

.notice {
  max-width: 32rem;
  margin: 15vh auto;
  padding: 2rem;
  text-align: center;
  line-height: 1.55;
  color: var(--ink);
  background: var(--cream);
  border-radius: 20px;
}
.notice h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }

/* focus visibility for keyboard users (applies to all buttons below) */
button:focus-visible,
[role='button']:focus-visible,
input:focus-visible {
  outline: 2px solid var(--espresso);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Verify build + guard test**

Run: `npm run build && npm test -- renderer`
Expected: build succeeds; renderer guard test PASS. (No visual test here; the look is verified once components and layout land, in Task 7 and the final review.)

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat(ui): warm light theme tokens and base styles"
```

---

### Task 3: Action bar (restyle CorrectionControls)

**Files:**
- Modify: `src/ui/CorrectionControls.tsx`
- Modify: `src/App.css` (append `.action-bar` appearance)
- Modify: `tests/ui/CorrectionControls.test.tsx`

**Interfaces:**
- Consumes: `RenderMode` from `../render/VisionRenderer`.
- Produces: `CorrectionControls({ mode, onMode })` unchanged signature; renders a `.action-bar` group with buttons labeled "With glasses" / "Without" / "Compare" and `aria-pressed`.

- [ ] **Step 1: Update the test to the new labels**

Replace `tests/ui/CorrectionControls.test.tsx` with:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CorrectionControls } from '../../src/ui/CorrectionControls';

describe('CorrectionControls', () => {
  it('emits mode changes and marks the active mode', async () => {
    const onMode = vi.fn();
    render(<CorrectionControls mode="sharp" onMode={onMode} />);
    expect(screen.getByRole('button', { name: /with glasses/i })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /^without$/i }));
    expect(onMode).toHaveBeenCalledWith('blurred');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    expect(onMode).toHaveBeenCalledWith('wipe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- CorrectionControls`
Expected: FAIL — no button named "Without" (current label is "Without glasses").

- [ ] **Step 3: Rewrite `src/ui/CorrectionControls.tsx`**

```tsx
import type { RenderMode } from '../render/VisionRenderer';

const OPTIONS: { value: RenderMode; label: string }[] = [
  { value: 'sharp', label: 'With glasses' },
  { value: 'blurred', label: 'Without' },
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
    <div className="action-bar" role="group" aria-label="Correction">
      {OPTIONS.map((o) => (
        <button key={o.value} aria-pressed={mode === o.value} onClick={() => onMode(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Append `.action-bar` styles to `src/App.css`**

```css
/* --- action bar (primary correction control) --- */
.action-bar {
  display: inline-flex;
  gap: 3px;
  background: var(--chrome);
  border-radius: 999px;
  padding: 4px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.20);
}
.action-bar button {
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 650;
  padding: 9px 15px;
  min-height: 44px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}
.action-bar button[aria-pressed='true'] { background: var(--espresso); color: #fff; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- CorrectionControls`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/CorrectionControls.tsx src/App.css tests/ui/CorrectionControls.test.tsx
git commit -m "feat(ui): floating action bar styling and short labels"
```

---

### Task 4: Chrome buttons — IconButton, SourceChip, NextButton

**Files:**
- Create: `src/ui/IconButton.tsx`, `src/ui/SourceChip.tsx`, `src/ui/NextButton.tsx`
- Modify: `src/App.css` (append appearance for `.icon-btn`, `.source-chip`, `.next-btn`)
- Test: `tests/ui/SourceChip.test.tsx`, `tests/ui/NextButton.test.tsx`

**Interfaces:**
- Consumes: `SourceKind` from `./types`; icons from `./icons`; `SCENES` from `../sources/scenes`.
- Produces:
  - `IconButton({ label, onClick, variant?, children })` — `variant?: 'chrome' | 'espresso'` (default `'chrome'`); renders `<button className="icon-btn ...">` with `aria-label={label}`.
  - `SourceChip({ kind, sceneLabel, onOpen })` — `.source-chip` button showing source icon + label + ChevronDown; `onClick=onOpen`. Label: `Camera` | `Scenes` | `Photos`.
  - `NextButton({ onNext })` — espresso `IconButton` with `ChevronRight`, `aria-label="Next photo"`.

- [ ] **Step 1: Write `src/ui/IconButton.tsx`**

```tsx
import type { ReactNode } from 'react';

export function IconButton({
  label,
  onClick,
  variant = 'chrome',
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: 'chrome' | 'espresso';
  children: ReactNode;
}) {
  return (
    <button className={`icon-btn icon-btn--${variant}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Write the failing tests**

`tests/ui/SourceChip.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceChip } from '../../src/ui/SourceChip';

describe('SourceChip', () => {
  it('shows the current source label and opens settings on click', async () => {
    const onOpen = vi.fn();
    render(<SourceChip kind="photo" sceneLabel="Eye chart" onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: /photos/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /photos/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows the scene label when source is scenes', () => {
    render(<SourceChip kind="scene" sceneLabel="Astigmatism dial" onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /astigmatism dial/i })).toBeInTheDocument();
  });
});
```

`tests/ui/NextButton.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextButton } from '../../src/ui/NextButton';

describe('NextButton', () => {
  it('advances on click', async () => {
    const onNext = vi.fn();
    render(<NextButton onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /next photo/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- SourceChip NextButton`
Expected: FAIL — cannot find modules.

- [ ] **Step 4: Write `src/ui/SourceChip.tsx`**

```tsx
import type { SourceKind } from './types';
import { CameraIcon, ShapesIcon, ImageIcon, ChevronDown } from './icons';

export function SourceChip({
  kind,
  sceneLabel,
  onOpen,
}: {
  kind: SourceKind;
  sceneLabel: string;
  onOpen: () => void;
}) {
  const icon = kind === 'camera' ? <CameraIcon size={15} /> : kind === 'scene' ? <ShapesIcon size={15} /> : <ImageIcon size={15} />;
  const label = kind === 'camera' ? 'Camera' : kind === 'scene' ? sceneLabel : 'Photos';
  return (
    <button className="source-chip" onClick={onOpen} aria-label={`Source: ${label}. Open settings`}>
      {icon}
      <span>{label}</span>
      <ChevronDown size={13} />
    </button>
  );
}
```

- [ ] **Step 5: Write `src/ui/NextButton.tsx`**

```tsx
import { IconButton } from './IconButton';
import { ChevronRight } from './icons';

export function NextButton({ onNext }: { onNext: () => void }) {
  return (
    <IconButton label="Next photo" onClick={onNext} variant="espresso">
      <ChevronRight size={24} />
    </IconButton>
  );
}
```

- [ ] **Step 6: Append appearance styles to `src/App.css`**

```css
/* --- circular chrome buttons --- */
.icon-btn {
  display: grid; place-items: center;
  width: 44px; height: 44px;
  border: 0; border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--chrome-shadow);
}
.icon-btn--chrome { background: var(--chrome); color: var(--ink); }
.icon-btn--espresso { background: var(--espresso); color: #fff; box-shadow: 0 8px 20px rgba(55, 41, 29, 0.45); }

/* --- source chip --- */
.source-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--chrome); color: var(--ink);
  border: 0; border-radius: 999px;
  padding: 8px 13px; min-height: 40px;
  font: inherit; font-size: 0.78rem; font-weight: 650;
  cursor: pointer; box-shadow: var(--chrome-shadow);
}
.source-chip span { line-height: 1; }
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- SourceChip NextButton`
Expected: PASS (SourceChip 2, NextButton 1).

- [ ] **Step 8: Commit**

```bash
git add src/ui/IconButton.tsx src/ui/SourceChip.tsx src/ui/NextButton.tsx src/App.css tests/ui/SourceChip.test.tsx tests/ui/NextButton.test.tsx
git commit -m "feat(ui): chrome icon button, source chip, next button"
```

---

### Task 5: SettingsSheet (+ restyle EyeToggle, RxPanel)

**Files:**
- Create: `src/ui/SettingsSheet.tsx`
- Modify: `src/ui/EyeToggle.tsx` (className only — verify it uses `.seg`), `src/ui/RxPanel.tsx` (chips + self-managed expander)
- Modify: `src/App.css` (append sheet + `.seg` + prescription styles)
- Test: `tests/ui/SettingsSheet.test.tsx`, `tests/ui/RxPanel.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `SourceKind`; `EyeSelection`, `Prescription`, `EyeRx`; `SCENES`; `PRESETS`; icons; `EyeToggle`, `RxPanel`.
- Produces:
  - `SettingsSheet(props)` where props = `{ open: boolean; onClose: () => void; kind: SourceKind; onKind: (k: SourceKind) => void; sceneId: string; onScene: (id: string) => void; selection: EyeSelection; onSelection: (v: EyeSelection) => void; rx: Prescription; onRx: (rx: Prescription) => void }`. Renders nothing when `open` is false.
  - `RxPanel({ rx, onRx })` — NEW signature (no `open`/`onToggle`); presets as `.preset-chip` buttons + self-managed "Fine-tune each eye" expander (`data-testid="finetune-toggle"`) revealing per-eye sliders (`data-testid="rx-panel"`).
  - `EyeToggle` unchanged signature (`{ value, onChange }`); still renders `.seg`.

- [ ] **Step 1: Confirm `src/ui/EyeToggle.tsx` uses `.seg`**

It already renders `<div className="seg" role="group" aria-label="Eye">`. No code change needed — the `.seg` style is (re)defined in Step 7 below. Leave the file as-is.

- [ ] **Step 2: Rewrite `tests/ui/RxPanel.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxPanel } from '../../src/ui/RxPanel';
import { TOMMY_RX } from '../../src/optics/presets';

describe('RxPanel', () => {
  it('applies a preset when its chip is clicked', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} />);
    await userEvent.click(screen.getByRole('button', { name: /^20\/40$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
    expect(onRx.mock.calls[0][0].right.sph).toBe(-1.0);
  });

  it('reveals per-eye sliders only after opening the fine-tune expander', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} />);
    expect(screen.queryByTestId('rx-panel')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('finetune-toggle'));
    const slider = screen.getByLabelText(/right sphere/i) as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '-10');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    const applied = onRx.mock.calls.at(-1)![0];
    expect(applied.right.sph).toBeCloseTo(-10);
    expect(applied.left.sph).toBe(TOMMY_RX.left.sph);
  });
});
```

- [ ] **Step 3: Write the failing `SettingsSheet` test**

`tests/ui/SettingsSheet.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsSheet } from '../../src/ui/SettingsSheet';
import { TOMMY_RX } from '../../src/optics/presets';
import { SCENES } from '../../src/sources/scenes';

function props(overrides = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    kind: 'scene' as const,
    onKind: vi.fn(),
    sceneId: SCENES[0].id,
    onScene: vi.fn(),
    selection: 'both' as const,
    onSelection: vi.fn(),
    rx: TOMMY_RX,
    onRx: vi.fn(),
    ...overrides,
  };
}

describe('SettingsSheet', () => {
  it('renders nothing when closed', () => {
    render(<SettingsSheet {...props({ open: false })} />);
    expect(screen.queryByTestId('settings-sheet')).not.toBeInTheDocument();
  });

  it('switches source', async () => {
    const onKind = vi.fn();
    render(<SettingsSheet {...props({ onKind })} />);
    await userEvent.click(screen.getByRole('button', { name: /camera/i }));
    expect(onKind).toHaveBeenCalledWith('camera');
  });

  it('shows the scene sub-picker only when source is scenes', () => {
    const { rerender } = render(<SettingsSheet {...props({ kind: 'scene' })} />);
    expect(screen.getByRole('button', { name: /eye chart/i })).toBeInTheDocument();
    rerender(<SettingsSheet {...props({ kind: 'photo' })} />);
    expect(screen.queryByRole('button', { name: /eye chart/i })).not.toBeInTheDocument();
  });

  it('changes eye selection and applies a preset', async () => {
    const onSelection = vi.fn();
    const onRx = vi.fn();
    render(<SettingsSheet {...props({ onSelection, onRx })} />);
    await userEvent.click(screen.getByRole('button', { name: /^left$/i }));
    expect(onSelection).toHaveBeenCalledWith('left');
    await userEvent.click(screen.getByRole('button', { name: /^20\/40$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
  });

  it('closes on Done and on scrim click', async () => {
    const onClose = vi.fn();
    render(<SettingsSheet {...props({ onClose })} />);
    await userEvent.click(screen.getByRole('button', { name: /^done$/i }));
    fireEvent.click(screen.getByTestId('settings-scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- SettingsSheet RxPanel`
Expected: FAIL — `SettingsSheet` module missing; `RxPanel` new API not present.

- [ ] **Step 5: Rewrite `src/ui/RxPanel.tsx`**

```tsx
import { useState } from 'react';
import type { Prescription, EyeRx } from '../optics/types';
import { PRESETS } from '../optics/presets';
import { ChevronRight } from './icons';

type EyeKey = 'right' | 'left';
type Field = keyof EyeRx;

function sameRx(a: Prescription, b: Prescription): boolean {
  const eq = (x: EyeRx, y: EyeRx) => x.sph === y.sph && x.cyl === y.cyl && x.axis === y.axis;
  return eq(a.right, b.right) && eq(a.left, b.left);
}

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
      <label className="slider-field">
        {label} sphere: {eye.sph.toFixed(2)} D
        <input type="range" min={-20} max={0} step={0.25} value={eye.sph}
          onChange={(e) => onField(eyeKey, 'sph', parseFloat(e.target.value))} />
      </label>
      <label className="slider-field">
        {label} cylinder: {eye.cyl.toFixed(2)} D
        <input type="range" min={-6} max={0} step={0.25} value={eye.cyl}
          onChange={(e) => onField(eyeKey, 'cyl', parseFloat(e.target.value))} />
      </label>
      <label className="slider-field">
        {label} axis: {eye.axis}°
        <input type="range" min={0} max={180} step={1} value={eye.axis}
          onChange={(e) => onField(eyeKey, 'axis', parseFloat(e.target.value))} />
      </label>
    </div>
  );
}

export function RxPanel({ rx, onRx }: { rx: Prescription; onRx: (rx: Prescription) => void }) {
  const [open, setOpen] = useState(false);
  const onField = (eyeKey: EyeKey, field: Field, value: number) => {
    onRx({ ...rx, [eyeKey]: { ...rx[eyeKey], [field]: value } });
  };
  return (
    <div>
      <div className="preset-chips">
        {PRESETS.map((p) => (
          <button key={p.id} className="preset-chip" aria-pressed={sameRx(p.rx, rx)} onClick={() => onRx(p.rx)}>
            {p.label}
          </button>
        ))}
      </div>
      <button className="expander" aria-expanded={open} data-testid="finetune-toggle" onClick={() => setOpen((o) => !o)}>
        Fine-tune each eye
        <span className={open ? 'chev chev--open' : 'chev'}><ChevronRight size={16} /></span>
      </button>
      {open && (
        <div className="eye-sliders" data-testid="rx-panel">
          <EyeSliders eyeKey="right" label="Right" eye={rx.right} onField={onField} />
          <EyeSliders eyeKey="left" label="Left" eye={rx.left} onField={onField} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write `src/ui/SettingsSheet.tsx`**

```tsx
import type { ReactNode } from 'react';
import type { SourceKind } from './types';
import type { EyeSelection, Prescription } from '../optics/types';
import { SCENES } from '../sources/scenes';
import { CameraIcon, ShapesIcon, ImageIcon } from './icons';
import { EyeToggle } from './EyeToggle';
import { RxPanel } from './RxPanel';

const SOURCES: { value: SourceKind; label: string; icon: ReactNode }[] = [
  { value: 'camera', label: 'Camera', icon: <CameraIcon size={15} /> },
  { value: 'scene', label: 'Scenes', icon: <ShapesIcon size={15} /> },
  { value: 'photo', label: 'Photos', icon: <ImageIcon size={15} /> },
];

export function SettingsSheet({
  open,
  onClose,
  kind,
  onKind,
  sceneId,
  onScene,
  selection,
  onSelection,
  rx,
  onRx,
}: {
  open: boolean;
  onClose: () => void;
  kind: SourceKind;
  onKind: (k: SourceKind) => void;
  sceneId: string;
  onScene: (id: string) => void;
  selection: EyeSelection;
  onSelection: (v: EyeSelection) => void;
  rx: Prescription;
  onRx: (rx: Prescription) => void;
}) {
  if (!open) return null;
  return (
    <div className="sheet-scrim" data-testid="settings-scrim" onClick={onClose}>
      <div
        className="sheet"
        data-testid="settings-sheet"
        role="dialog"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-body">
          <section className="section">
            <div className="section-label">Source</div>
            <div className="seg" role="group" aria-label="Source">
              {SOURCES.map((s) => (
                <button key={s.value} aria-pressed={kind === s.value} onClick={() => onKind(s.value)}>
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
            {kind === 'scene' && (
              <div className="subseg" role="group" aria-label="Scene">
                {SCENES.map((sc) => (
                  <button key={sc.id} aria-pressed={sceneId === sc.id} onClick={() => onScene(sc.id)}>
                    {sc.label}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-label">Eyes</div>
            <EyeToggle value={selection} onChange={onSelection} />
            {selection === 'both' && (
              <p className="hint" data-testid="both-hint">“Both” is an approximate blend of the two eyes.</p>
            )}
          </section>

          <section className="section">
            <div className="section-label">Prescription</div>
            <RxPanel rx={rx} onRx={onRx} />
          </section>

          <button className="done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Append sheet + `.seg` + prescription styles to `src/App.css`**

```css
/* --- segmented pills (source + eyes, inside the sheet) --- */
.seg { display: flex; gap: 5px; }
.seg button {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; background: var(--surface); color: var(--ink);
  font: inherit; font-size: 0.78rem; font-weight: 600;
  padding: 0 8px; min-height: 44px; border-radius: 13px; cursor: pointer;
}
.seg button[aria-pressed='true'] { background: var(--espresso); color: #fff; }

.subseg { display: flex; gap: 5px; margin-top: 6px; }
.subseg button {
  flex: 1; border: 1px solid var(--line); background: transparent; color: var(--ink);
  font: inherit; font-size: 0.74rem; font-weight: 600;
  padding: 0 6px; min-height: 40px; border-radius: 11px; cursor: pointer;
}
.subseg button[aria-pressed='true'] { background: var(--ink); color: #fff; border-color: var(--ink); }

/* --- settings sheet --- */
.sheet-scrim {
  position: absolute; inset: 0; z-index: 20;
  background: rgba(20, 14, 10, 0.5);
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; max-height: 85%; overflow-y: auto;
  background: var(--cream);
  border-radius: 26px 26px 0 0;
  padding: 10px 16px calc(18px + env(safe-area-inset-bottom));
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  animation: sheet-up 240ms ease;
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle { width: 38px; height: 5px; border-radius: 999px; background: #d9d0c6; margin: 2px auto 8px; }
.sheet-body { display: flex; flex-direction: column; }
.section { margin-top: 12px; }
.section-label {
  font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted); font-weight: 700; margin: 0 2px 8px;
}
.hint { font-size: 0.72rem; color: var(--muted); margin: 8px 2px 0; }

/* --- prescription --- */
.preset-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.preset-chip {
  border: 0; background: var(--surface); color: var(--ink);
  font: inherit; font-size: 0.75rem; font-weight: 600;
  padding: 9px 13px; min-height: 40px; border-radius: 999px; cursor: pointer;
}
.preset-chip[aria-pressed='true'] { background: var(--espresso); color: #fff; }
.expander {
  width: 100%; margin-top: 10px;
  display: flex; align-items: center; justify-content: space-between;
  border: 0; background: var(--surface); color: var(--ink);
  font: inherit; font-size: 0.8rem; font-weight: 650;
  padding: 13px 14px; min-height: 44px; border-radius: 13px; cursor: pointer;
}
.expander .chev { display: inline-flex; transition: transform 160ms ease; }
.expander .chev--open { transform: rotate(90deg); }
.eye-sliders { margin-top: 10px; display: flex; flex-direction: column; gap: 14px; }
.eye-group { display: flex; flex-direction: column; gap: 4px; }
.eye-group strong { font-size: 0.8rem; }
.slider-field { display: flex; flex-direction: column; gap: 2px; font-size: 0.72rem; color: var(--muted); }
.slider-field input[type='range'] { width: 100%; height: 44px; accent-color: var(--espresso); cursor: pointer; }

/* --- done button --- */
.done-btn {
  margin-top: 16px; border: 0; background: var(--espresso); color: #fff;
  font: inherit; font-size: 0.9rem; font-weight: 700;
  padding: 15px; border-radius: 15px; cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .sheet { animation: none; }
  .expander .chev { transition: none; }
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- SettingsSheet RxPanel EyeToggle`
Expected: PASS (SettingsSheet 5, RxPanel 2, EyeToggle 1).

- [ ] **Step 9: Commit**

```bash
git add src/ui/SettingsSheet.tsx src/ui/RxPanel.tsx src/App.css tests/ui/SettingsSheet.test.tsx tests/ui/RxPanel.test.tsx
git commit -m "feat(ui): settings bottom sheet with source, eyes, prescription"
```

---

### Task 6: App integration — new layout, default sharp, caption

**Files:**
- Modify: `src/App.tsx` (rewrite render tree + state), `src/ui/AttributionChip.tsx` (caption), `src/App.css` (append layout placement + caption + toast + wipe)
- Delete: `src/ui/SourceSwitcher.tsx`

**Interfaces:**
- Consumes: `SourceChip`, `IconButton`, `NextButton`, `SettingsSheet`, `SettingsIcon`, `CorrectionControls`, `WipeHandle`, `AttributionChip`, `Toast`; `SCENES`.
- Produces: the redesigned app. Default `mode = 'sharp'`. `settingsOpen` state gates the sheet.

- [ ] **Step 1: Rewrite `src/ui/AttributionChip.tsx` as the caption**

```tsx
import type { Photo } from '../sources/openverse';

export function AttributionChip({ photo }: { photo: Photo }) {
  return (
    <div className="caption" data-testid="attribution">
      <span className="who">{photo.creator}</span>
      {' · '}
      {photo.title}
      {' · '}
      {photo.license}
      {' · '}
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">source</a>
    </div>
  );
}
```

- [ ] **Step 2: Delete the obsolete SourceSwitcher**

Run: `git rm src/ui/SourceSwitcher.tsx`
(There is no SourceSwitcher test file to remove.)

- [ ] **Step 3: Rewrite `src/App.tsx`**

Replace the entire file with:
```tsx
import { useEffect, useRef, useState } from 'react';
import { VisionRenderer } from './render/VisionRenderer';
import type { RenderMode } from './render/VisionRenderer';
import { selectedEyes } from './engine/selectedEyes';
import { SCENES } from './sources/scenes';
import { startCamera } from './sources/camera';
import type { CameraHandle } from './sources/camera';
import { TOMMY_RX } from './optics/presets';
import { DEFAULT_BLUR_GAIN } from './optics/blur';
import { parseGainParam } from './ui/parseGainParam';
import type { Prescription, EyeSelection } from './optics/types';
import type { SourceKind } from './ui/types';
import { useLatestRef } from './ui/useLatestRef';
import { fetchPhotoPool } from './sources/openverse';
import type { Photo } from './sources/openverse';
import { loadImage } from './sources/loadImage';
import { AttributionChip } from './ui/AttributionChip';
import { Toast } from './ui/Toast';
import { CorrectionControls } from './ui/CorrectionControls';
import { WipeHandle } from './ui/WipeHandle';
import { SourceChip } from './ui/SourceChip';
import { IconButton } from './ui/IconButton';
import { NextButton } from './ui/NextButton';
import { SettingsSheet } from './ui/SettingsSheet';
import { SettingsIcon } from './ui/icons';

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
  const [rx, setRx] = useState<Prescription>(TOMMY_RX);
  const [selection, setSelection] = useState<EyeSelection>('both');
  const [mode, setMode] = useState<RenderMode>('sharp');
  const [wipe, setWipe] = useState(0.5);
  const [gain] = useState(() => parseGainParam(window.location.search) ?? DEFAULT_BLUR_GAIN);
  const [kind, setKind] = useState<SourceKind>('scene');
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        setToast('Camera unavailable — showing a scene instead.');
        setKind('scene');
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // load a mixed, shuffled photo pool when entering photo mode or when it empties
  useEffect(() => {
    if (kind !== 'photo') return;
    if (photos.length > 0) return;
    let cancelled = false;
    fetchPhotoPool()
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

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // renderer + rAF loop + resize (mount once)
  useEffect(() => {
    const canvas = canvasRef.current!;
    let renderer: VisionRenderer;
    try {
      renderer = new VisionRenderer(canvas);
    } catch (err) {
      console.error('VisionRenderer init failed:', err);
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
      try {
        const src = sourceRef.current;
        if (src && src.w > 0 && src.h > 0) {
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
      } catch {
        // skip this frame; a single bad frame shouldn't kill the render loop
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

  const currentPhoto = kind === 'photo' ? photos[photoIndex] : undefined;
  const sceneLabel = SCENES.find((s) => s.id === sceneId)?.label ?? 'Scenes';
  const shuffle = () => {
    if (photoIndex + 1 >= photos.length) setPhotos([]);
    else setPhotoIndex((i) => i + 1);
  };

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
      {mode === 'wipe' && <WipeHandle value={wipe} onChange={setWipe} />}

      <div className="chrome-top">
        <SourceChip kind={kind} sceneLabel={sceneLabel} onOpen={() => setSettingsOpen(true)} />
        <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </div>

      {currentPhoto && <AttributionChip photo={currentPhoto} />}

      <div className="chrome-bottom">
        <CorrectionControls mode={mode} onMode={setMode} />
      </div>
      {kind === 'photo' && (
        <div className="next-slot">
          <NextButton onNext={shuffle} />
        </div>
      )}

      <Toast message={toast} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        kind={kind}
        onKind={setKind}
        sceneId={sceneId}
        onScene={setSceneId}
        selection={selection}
        onSelection={setSelection}
        rx={rx}
        onRx={setRx}
      />
    </div>
  );
}
```

- [ ] **Step 4: Append layout placement + caption + toast + wipe styles to `src/App.css`**

```css
/* --- floating chrome placement --- */
.chrome-top {
  position: absolute; z-index: 4;
  top: calc(env(safe-area-inset-top) + 14px); left: 14px; right: 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.chrome-bottom {
  position: absolute; z-index: 4;
  left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom) + 20px);
  display: flex; justify-content: center;
}
.next-slot {
  position: absolute; z-index: 4;
  right: 16px; bottom: calc(env(safe-area-inset-bottom) + 18px);
}

/* --- attribution caption --- */
.caption {
  position: absolute; z-index: 4;
  left: 16px; right: 70px; bottom: calc(env(safe-area-inset-bottom) + 78px);
  color: #fff; font-size: 0.76rem; line-height: 1.3;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
}
.caption .who { font-weight: 700; }
.caption a { color: #fff; text-decoration: underline; }

/* --- toast --- */
.toast {
  position: absolute; z-index: 30;
  left: 50%; transform: translateX(-50%);
  bottom: calc(env(safe-area-inset-bottom) + 84px);
  background: var(--espresso); color: #fff;
  padding: 10px 16px; border-radius: 999px; font-size: 0.8rem;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
}

/* --- compare wipe handle --- */
.wipe-track { position: absolute; inset: 0; z-index: 3; touch-action: none; }
.wipe-handle { position: absolute; top: 0; bottom: 0; width: 2px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.15); }
.wipe-handle::after {
  content: '‹ ›'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #fff; color: var(--espresso); font-weight: 700;
  width: 34px; height: 34px; border-radius: 999px; display: grid; place-items: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 5: Verify typecheck, tests, build**

Run: `npm run typecheck && npm test && npm run build`
Expected: typecheck clean; all unit tests PASS; build succeeds. (No `SourceSwitcher` import remains; `EyeToggle`/`RxPanel` are only used via `SettingsSheet`.)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/ui/AttributionChip.tsx src/App.css
git rm --cached src/ui/SourceSwitcher.tsx 2>/dev/null || true
git commit -m "feat(ui): immersive layout, settings sheet wiring, default With glasses"
```

---

### Task 7: Update E2E flows for the redesigned UI

**Files:**
- Modify: `tests/e2e/flows.spec.ts`

**Interfaces:**
- Consumes: the built app. The dev/StrictMode regression spec (`dev-strictmode.spec.ts`) is unchanged.

- [ ] **Step 1: Rewrite `tests/e2e/flows.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('renders the stage and switches correction modes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('stage')).toBeVisible();
  await expect(page.getByTestId('webgl-error')).toHaveCount(0);

  // Default is "With glasses" (sharp).
  await expect(page.getByRole('button', { name: /with glasses/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^without$/i }).click();
  await expect(page.getByRole('button', { name: /^without$/i })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /compare/i }).click();
  await expect(page.getByTestId('wipe-handle')).toBeVisible();
});

test('camera denied falls back to a scene (from the settings sheet)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^settings$/i }).click();
  await expect(page.getByTestId('settings-sheet')).toBeVisible();
  await page.getByRole('button', { name: /camera/i }).click();
  await expect(page.getByTestId('toast')).toContainText(/camera unavailable/i);
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
  await page.getByRole('button', { name: /^settings$/i }).click();
  await page.getByRole('button', { name: /photos/i }).click();
  await page.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByTestId('attribution')).toContainText('Jane Doe');
  await expect(page.getByTestId('attribution')).toContainText('CC BY 4.0');
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e`
Expected: all specs PASS (3 in `flows.spec.ts` + 1 in `dev-strictmode.spec.ts`). The `webServer` builds and serves both preview and dev.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/flows.spec.ts
git commit -m "test(e2e): update flows for redesigned settings-sheet UI"
```

---

## Notes for the executor

- Run Tasks 1–7 in order. Each task's unit tests should stay green at its own commit; the app only *looks* correct after Task 6, and E2E passes after Task 7.
- After Task 7, do a full verification: `npm run typecheck && npm test && npm run build && npm run test:e2e`, then load the dev server and confirm the warm layout renders, the action bar defaults to "With glasses", the gear/chip open the sheet, source switching works, and photos show the Next button + caption.
- The `?gain=` calibration override and `DEFAULT_BLUR_GAIN = 0.0018` are unchanged — do not touch optics/render/engine/sources logic.
