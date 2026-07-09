export interface EyeRx {
  sph: number;   // diopters (negative for myopia)
  cyl: number;   // diopters (negative-cyl convention)
  axis: number;  // degrees, 0..180
}

export interface Prescription {
  right: EyeRx;  // OD
  left: EyeRx;   // OS
}

export type EyeSelection = 'left' | 'right' | 'both';

export interface MeridianPower {
  angleDeg: number; // normalized 0..180
  power: number;    // diopters
}

export interface EyeMeridians {
  m1: MeridianPower; // at axis, power = sph
  m2: MeridianPower; // at axis+90, power = sph + cyl
}

export interface BlurParams {
  sigma1: number;   // px, spread along m1 direction
  sigma2: number;   // px, spread along m2 direction
  angleRad: number; // m1 direction from +x axis, radians
}
