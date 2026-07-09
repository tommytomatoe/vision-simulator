import { describe, it, expect } from 'vitest';
import { eyeMeridians } from '../../src/optics/meridians';

describe('eyeMeridians', () => {
  it('splits OD (-13.25, -3.25, axis 5) into two meridians', () => {
    const m = eyeMeridians({ sph: -13.25, cyl: -3.25, axis: 5 });
    expect(m.m1.angleDeg).toBeCloseTo(5);
    expect(m.m1.power).toBeCloseTo(-13.25);
    expect(m.m2.angleDeg).toBeCloseTo(95);
    expect(m.m2.power).toBeCloseTo(-16.5);
  });

  it('normalizes axis 180 to 0 and wraps the perpendicular to 90', () => {
    const m = eyeMeridians({ sph: -15, cyl: -1.25, axis: 180 });
    expect(m.m1.angleDeg).toBeCloseTo(0);
    expect(m.m1.power).toBeCloseTo(-15);
    expect(m.m2.angleDeg).toBeCloseTo(90);
    expect(m.m2.power).toBeCloseTo(-16.25);
  });

  it('a pure sphere has equal-power meridians', () => {
    const m = eyeMeridians({ sph: -4, cyl: 0, axis: 0 });
    expect(m.m1.power).toBeCloseTo(-4);
    expect(m.m2.power).toBeCloseTo(-4);
  });
});
