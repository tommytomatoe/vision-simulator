import { describe, it, expect } from 'vitest';
import { parseGainParam } from '../../src/ui/parseGainParam';

describe('parseGainParam', () => {
  it('reads a positive gain from the query string', () => {
    expect(parseGainParam('?gain=0.0025')).toBeCloseTo(0.0025);
    expect(parseGainParam('gain=0.004')).toBeCloseTo(0.004);
  });

  it('returns null when absent, empty, or non-numeric', () => {
    expect(parseGainParam('')).toBeNull();
    expect(parseGainParam('?foo=1')).toBeNull();
    expect(parseGainParam('?gain=abc')).toBeNull();
  });

  it('rejects non-positive or non-finite values', () => {
    expect(parseGainParam('?gain=0')).toBeNull();
    expect(parseGainParam('?gain=-0.001')).toBeNull();
    expect(parseGainParam('?gain=Infinity')).toBeNull();
  });
});
