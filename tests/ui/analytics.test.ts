import { describe, it, expect, vi, afterEach } from 'vitest';
import { track } from '../../src/analytics';

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

afterEach(() => {
  delete (window as GtagWindow).gtag;
});

describe('track', () => {
  it('forwards events to gtag when GA is present', () => {
    const gtag = vi.fn();
    (window as GtagWindow).gtag = gtag;
    track('correction_change', { mode: 'sharp' });
    expect(gtag).toHaveBeenCalledWith('event', 'correction_change', { mode: 'sharp' });
  });

  it('is a safe no-op when GA is absent (dev builds)', () => {
    expect(() => track('correction_change', { mode: 'blurred' })).not.toThrow();
  });
});
