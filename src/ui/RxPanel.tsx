import type { Prescription, EyeRx } from '../optics/types';
import { PRESETS } from '../optics/presets';

type EyeKey = 'right' | 'left';
type Field = keyof EyeRx;

function EyeSliders({
  eyeKey,
  label,
  eye,
  onField,
}: {
  eyeKey: EyeKey;
  label: string;
  eye: EyeRx;
  onField: (eyeKey: EyeKey, field: Field, value: number) => void;
}) {
  return (
    <div className="eye-group">
      <strong>{label}</strong>
      <label>
        {label} sphere: {eye.sph.toFixed(2)} D
        <input
          type="range"
          min={-20}
          max={0}
          step={0.25}
          value={eye.sph}
          onChange={(e) => onField(eyeKey, 'sph', parseFloat(e.target.value))}
        />
      </label>
      <label>
        {label} cylinder: {eye.cyl.toFixed(2)} D
        <input
          type="range"
          min={-6}
          max={0}
          step={0.25}
          value={eye.cyl}
          onChange={(e) => onField(eyeKey, 'cyl', parseFloat(e.target.value))}
        />
      </label>
      <label>
        {label} axis: {eye.axis}°
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={eye.axis}
          onChange={(e) => onField(eyeKey, 'axis', parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
}

export function RxPanel({
  rx,
  onRx,
  open,
  onToggle,
}: {
  rx: Prescription;
  onRx: (rx: Prescription) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const onField = (eyeKey: EyeKey, field: Field, value: number) => {
    onRx({ ...rx, [eyeKey]: { ...rx[eyeKey], [field]: value } });
  };

  return (
    <div>
      <div className="row">
        <button className="btn" onClick={onToggle} aria-expanded={open}>
          {open ? 'Hide prescription ▾' : 'Adjust prescription ▸'}
        </button>
      </div>
      {open && (
        <div className="rx-panel" data-testid="rx-panel">
          <div className="row">
            {PRESETS.map((p) => (
              <button key={p.id} className="btn" onClick={() => onRx(p.rx)}>
                {p.label}
              </button>
            ))}
          </div>
          <EyeSliders eyeKey="right" label="Right" eye={rx.right} onField={onField} />
          <EyeSliders eyeKey="left" label="Left" eye={rx.left} onField={onField} />
        </div>
      )}
    </div>
  );
}
