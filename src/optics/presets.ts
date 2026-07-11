import { Prescription, EyeRx } from './types';

export interface Preset {
  id: string;
  label: string;
  /** Short label for the on-screen Rx chip; presets without one show per-eye spheres. */
  chipLabel?: string;
  rx: Prescription;
}

export const TOMMY_RX: Prescription = {
  right: { sph: -13.25, cyl: -3.25, axis: 5 },
  left: { sph: -15.0, cyl: -1.25, axis: 180 },
};

export const DEFAULT_PRESET_ID = 'tommy';

// Acuity ladder. Snellen acuity is defined by what you can resolve, not by a
// prescription, so these diopter values are approximate spherical-equivalent
// stand-ins for the uncorrected myopia that lands near each acuity level.
// They ride on top of the single blur calibration knob (DEFAULT_BLUR_GAIN),
// so treat them as honest illustrations, not clinical measurements.
function plano(): Prescription {
  return { right: { sph: 0, cyl: 0, axis: 0 }, left: { sph: 0, cyl: 0, axis: 0 } };
}

function sphere(sph: number): Prescription {
  return {
    right: { sph, cyl: 0, axis: 0 },
    left: { sph, cyl: 0, axis: 0 },
  };
}

export const PRESETS: Preset[] = [
  { id: '20-20', label: '20/20', chipLabel: '20/20 vision', rx: plano() },
  { id: '20-40', label: '20/40', chipLabel: '20/40 vision', rx: sphere(-1.0) },
  { id: '20-70', label: '20/70', chipLabel: '20/70 vision', rx: sphere(-1.75) },
  { id: '20-100', label: '20/100', chipLabel: '20/100 vision', rx: sphere(-2.5) },
  { id: '20-200', label: '20/200 (Legally blind)', chipLabel: '20/200 vision', rx: sphere(-4.0) },
  // Tommy's has no chipLabel on purpose: the chip shows the actual numbers.
  { id: 'tommy', label: "Tommy's eyes (−13/−15)", rx: TOMMY_RX },
];

export function sameRx(a: Prescription, b: Prescription): boolean {
  const eq = (x: EyeRx, y: EyeRx) => x.sph === y.sph && x.cyl === y.cyl && x.axis === y.axis;
  return eq(a.right, b.right) && eq(a.left, b.left);
}

// U+2212 minus, matching the typography of the preset labels above.
function formatSph(sph: number): string {
  return sph < 0 ? `−${Math.abs(sph).toFixed(2)}` : sph.toFixed(2);
}

/** Label for the on-screen Rx chip: a preset's chip label, else per-eye spheres. */
export function rxLabel(rx: Prescription): string {
  const preset = PRESETS.find((p) => sameRx(p.rx, rx));
  return preset?.chipLabel ?? `R ${formatSph(rx.right.sph)} · L ${formatSph(rx.left.sph)}`;
}
