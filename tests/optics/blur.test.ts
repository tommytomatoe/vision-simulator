import { describe, it, expect } from 'vitest';
import { computeBlur, DEFAULT_BLUR_GAIN } from '../../src/optics/blur';
import { eyeMeridians } from '../../src/optics/meridians';
import { PRESETS, TOMMY_RX, DEFAULT_PRESET_ID } from '../../src/optics/presets';

describe('computeBlur', () => {
  it('scales sigma with diopters, width, and gain', () => {
    const m = eyeMeridians({ sph: -13.25, cyl: -3.25, axis: 5 });
    const bp = computeBlur(m, 1000, DEFAULT_BLUR_GAIN);
    expect(bp.sigma1).toBeCloseTo(0.0012 * 13.25 * 1000, 3); // 15.9
    expect(bp.sigma2).toBeCloseTo(0.0012 * 16.5 * 1000, 3);  // 19.8
    expect(bp.angleRad).toBeCloseTo((5 * Math.PI) / 180, 6);
  });

  it('produces equal sigmas for a pure sphere', () => {
    const m = eyeMeridians({ sph: -6, cyl: 0, axis: 90 });
    const bp = computeBlur(m, 800);
    expect(bp.sigma1).toBeCloseTo(bp.sigma2, 6);
  });
});

describe('presets', () => {
  it("includes the author's Rx as the default preset", () => {
    const def = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    expect(def).toBeDefined();
    expect(def!.rx).toEqual(TOMMY_RX);
    expect(TOMMY_RX.right.sph).toBe(-13.25);
    expect(TOMMY_RX.left.sph).toBe(-15);
  });

  it('has unique preset ids', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
