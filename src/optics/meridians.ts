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
