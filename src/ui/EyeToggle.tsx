import type { EyeSelection } from '../optics/types';

const OPTIONS: { value: EyeSelection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'both', label: 'Both' },
  { value: 'right', label: 'Right' },
];

export function EyeToggle({
  value,
  onChange,
}: {
  value: EyeSelection;
  onChange: (v: EyeSelection) => void;
}) {
  return (
    <div className="seg" role="group" aria-label="Eye">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
