import { describe, it, expect } from 'vitest';
import { selectedEyes } from '../../src/engine/selectedEyes';
import { TOMMY_RX } from '../../src/optics/presets';

describe('selectedEyes', () => {
  it('returns one eye for right', () => {
    const e = selectedEyes(TOMMY_RX, 'right');
    expect(e).toHaveLength(1);
    expect(e[0].m1.power).toBeCloseTo(-13.25);
  });

  it('returns one eye for left', () => {
    const e = selectedEyes(TOMMY_RX, 'left');
    expect(e).toHaveLength(1);
    expect(e[0].m1.power).toBeCloseTo(-15);
  });

  it('returns both eyes as [right, left] for both', () => {
    const e = selectedEyes(TOMMY_RX, 'both');
    expect(e).toHaveLength(2);
    expect(e[0].m1.power).toBeCloseTo(-13.25);
    expect(e[1].m1.power).toBeCloseTo(-15);
  });
});
