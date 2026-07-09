import type { RenderMode } from '../render/VisionRenderer';

const OPTIONS: { value: RenderMode; label: string }[] = [
  { value: 'sharp', label: 'With glasses' },
  { value: 'blurred', label: 'Without glasses' },
  { value: 'wipe', label: 'Compare' },
];

export function CorrectionControls({
  mode,
  onMode,
}: {
  mode: RenderMode;
  onMode: (m: RenderMode) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Correction">
      {OPTIONS.map((o) => (
        <button key={o.value} aria-pressed={mode === o.value} onClick={() => onMode(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
