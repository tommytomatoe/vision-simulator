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
