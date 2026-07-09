import { EyeMeridians, BlurParams } from './types';

/**
 * Single calibration knob: Gaussian sigma (px) per diopter per px of canvas
 * width. Bundles assumed pupil diameter, field-of-view, and the blur-disc →
 * Gaussian-sigma conversion.
 *
 * Calibrated by eye against real vision: the eye chart at the author's
 * uncorrected Rx (−13.25 / −15.00) renders so the top letter is a ghost and
 * lower lines dissolve — matching a chart viewed across a room. Override at
 * runtime with the `?gain=` URL param to re-tune (see parseGainParam).
 */
export const DEFAULT_BLUR_GAIN = 0.0018;

export function computeBlur(
  m: EyeMeridians,
  canvasWidthPx: number,
  blurGain: number = DEFAULT_BLUR_GAIN,
): BlurParams {
  return {
    sigma1: blurGain * Math.abs(m.m1.power) * canvasWidthPx,
    sigma2: blurGain * Math.abs(m.m2.power) * canvasWidthPx,
    angleRad: (m.m1.angleDeg * Math.PI) / 180,
  };
}
