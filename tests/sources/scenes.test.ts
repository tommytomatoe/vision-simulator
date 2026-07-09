import { describe, it, expect } from 'vitest';
import { SCENES } from '../../src/sources/scenes';

describe('SCENES', () => {
  it('has unique ids and render functions', () => {
    const ids = SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCENES) expect(typeof s.render).toBe('function');
  });
});
