import { describe, it, expect } from 'vitest';
import { computeBlur, DEFAULT_BLUR_GAIN } from '../../src/optics/blur';
import { eyeMeridians } from '../../src/optics/meridians';
import { PRESETS, TOMMY_RX, DEFAULT_PRESET_ID } from '../../src/optics/presets';

describe('computeBlur', () => {
  it('scales sigma with diopters, width, and gain', () => {
    // Explicit literal gain so this formula test is independent of the
    // calibrated DEFAULT_BLUR_GAIN value (which is tuned by eye and changes).
    const m = eyeMeridians({ sph: -13.25, cyl: -3.25, axis: 5 });
    const bp = computeBlur(m, 1000, 0.001);
    expect(bp.sigma1).toBeCloseTo(0.001 * 13.25 * 1000, 3); // 13.25
    expect(bp.sigma2).toBeCloseTo(0.001 * 16.5 * 1000, 3);  // 16.5
    expect(bp.angleRad).toBeCloseTo((5 * Math.PI) / 180, 6);
  });

  it('defaults to the calibrated DEFAULT_BLUR_GAIN when no gain is passed', () => {
    const m = eyeMeridians({ sph: -10, cyl: 0, axis: 0 });
    expect(computeBlur(m, 1000).sigma1).toBeCloseTo(DEFAULT_BLUR_GAIN * 10 * 1000, 6);
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

  it('exposes the 20/xx acuity ladder in increasing severity', () => {
    const ladder = ['20-20', '20-40', '20-70', '20-100', '20-200'];
    const found = ladder.map((id) => PRESETS.find((p) => p.id === id));
    found.forEach((p, i) => expect(p, `missing ${ladder[i]}`).toBeDefined());
    // 20/20 is plano — no blur, the baseline
    expect(found[0]!.rx.right).toEqual({ sph: 0, cyl: 0, axis: 0 });
    expect(found[0]!.rx.left).toEqual({ sph: 0, cyl: 0, axis: 0 });
    // strictly increasing myopia down the ladder (spherical equivalent)
    const sphs = found.map((p) => p!.rx.right.sph);
    for (let i = 1; i < sphs.length; i++) {
      expect(sphs[i]).toBeLessThan(sphs[i - 1]);
    }
  });

  it('labels 20/200 as legally blind (the legal threshold)', () => {
    const lb = PRESETS.find((p) => p.id === '20-200');
    expect(lb).toBeDefined();
    expect(lb!.label.toLowerCase()).toContain('legally blind');
    expect(lb!.rx.right.sph).toBe(-4);
  });

  it('replaced the old vague descriptive presets', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).not.toContain('mild');
    expect(ids).not.toContain('moderate');
    expect(ids).not.toContain('strong');
  });
});
