/**
 * Thin Google Analytics wrapper. The gtag snippet is injected at build time
 * only when the VITE_GA_ID env var is set (see vite.config.ts), so in local
 * dev and test builds `window.gtag` is absent and track() is a safe no-op —
 * localhost never pollutes analytics.
 *
 * Event taxonomy (GA4 snake_case; keep params low-cardinality, no PII —
 * track preset ids and facts-of-use, never user-entered prescription values):
 * - correction_change {mode: sharp|blurred|wipe}
 * - source_change     {source: camera|scene|photo, trigger: settings|next_arrow}
 * - photo_next        {method: button|arrow_key}
 * - eye_change        {eye: left|both|right}
 * - preset_apply      {preset_id}
 * - finetune_open
 * - settings_open
 * - camera_denied
 * - webgl_unsupported
 */
type EventParams = Record<string, string | number | boolean>;

export function track(name: string, params?: EventParams): void {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}
