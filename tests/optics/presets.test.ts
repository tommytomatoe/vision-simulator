import { describe, it, expect } from 'vitest';
import { PRESETS, TOMMY_RX, rxLabel, sameRx } from '../../src/optics/presets';
import type { Prescription } from '../../src/optics/types';

const custom: Prescription = {
  right: { sph: -8.25, cyl: -1.0, axis: 90 },
  left: { sph: -6.5, cyl: 0, axis: 0 },
};

describe('sameRx', () => {
  it('matches identical prescriptions and rejects different ones', () => {
    expect(sameRx(TOMMY_RX, { right: { ...TOMMY_RX.right }, left: { ...TOMMY_RX.left } })).toBe(true);
    expect(sameRx(TOMMY_RX, custom)).toBe(false);
  });
});

describe('rxLabel', () => {
  it('labels acuity presets with their chip label', () => {
    const p2040 = PRESETS.find((p) => p.id === '20-40')!;
    expect(rxLabel(p2040.rx)).toBe('20/40 vision');
    const p20200 = PRESETS.find((p) => p.id === '20-200')!;
    expect(rxLabel(p20200.rx)).toBe('20/200 vision');
  });

  it("shows Tommy's prescription as per-eye spheres, not a preset name", () => {
    expect(rxLabel(TOMMY_RX)).toBe('R −13.25 · L −15.00');
  });

  it('formats custom prescriptions as per-eye spheres with two decimals', () => {
    expect(rxLabel(custom)).toBe('R −8.25 · L −6.50');
  });

  it('labels the farsighted preset with its chip label', () => {
    const plus5 = PRESETS.find((p) => p.id === 'plus-5')!;
    expect(plus5.rx.right.sph).toBe(5.0);
    expect(rxLabel(plus5.rx)).toBe('Farsighted +5');
  });

  it('formats positive spheres with an explicit plus sign', () => {
    const rx: Prescription = {
      right: { sph: 4.25, cyl: 0, axis: 0 },
      left: { sph: 3.5, cyl: -0.75, axis: 90 },
    };
    expect(rxLabel(rx)).toBe('R +4.25 · L +3.50');
  });

  it('formats a plano eye without a stray minus sign', () => {
    const rx: Prescription = {
      right: { sph: 0, cyl: -2.0, axis: 45 },
      left: { sph: -1.25, cyl: 0, axis: 0 },
    };
    expect(rxLabel(rx)).toBe('R 0.00 · L −1.25');
  });
});
