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
  { id: '20-20', label: '20/20', rx: plano() },
  { id: '20-40', label: '20/40', rx: sphere(-1.0) },
  { id: '20-70', label: '20/70', rx: sphere(-1.75) },
  { id: '20-100', label: '20/100', rx: sphere(-2.5) },
  { id: '20-200', label: '20/200 (Legally blind)', rx: sphere(-4.0) },
  { id: 'tommy', label: "Tommy's eyes (−13/−15)", rx: TOMMY_RX },
];
