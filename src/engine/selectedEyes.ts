import type { Prescription, EyeSelection, EyeMeridians } from '../optics/types';
import { eyeMeridians } from '../optics/meridians';

export function selectedEyes(rx: Prescription, sel: EyeSelection): EyeMeridians[] {
  const right = eyeMeridians(rx.right);
  const left = eyeMeridians(rx.left);
  if (sel === 'right') return [right];
  if (sel === 'left') return [left];
  return [right, left];
}
