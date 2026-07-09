/**
 * Calibration hook: read an optional `?gain=` override from a query string.
 * Lets the single blur calibration knob be swept from the URL (for tuning
 * DEFAULT_BLUR_GAIN against real vision) without a visible UI control.
 * Returns a positive finite gain, or null to fall back to DEFAULT_BLUR_GAIN.
 */
export function parseGainParam(search: string): number | null {
  const raw = new URLSearchParams(search).get('gain');
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
