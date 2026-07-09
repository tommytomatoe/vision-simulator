import { useState } from 'react';
import type { Prescription, EyeRx } from '../optics/types';
import { PRESETS } from '../optics/presets';
import { ChevronRight } from './icons';

type EyeKey = 'right' | 'left';
type Field = keyof EyeRx;

function sameRx(a: Prescription, b: Prescription): boolean {
  const eq = (x: EyeRx, y: EyeRx) => x.sph === y.sph && x.cyl === y.cyl && x.axis === y.axis;
  return eq(a.right, b.right) && eq(a.left, b.left);
}

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
      <label className="slider-field">
        {label} sphere: {eye.sph.toFixed(2)} D
        <input type="range" min={-20} max={0} step={0.25} value={eye.sph}
          onChange={(e) => onField(eyeKey, 'sph', parseFloat(e.target.value))} />
      </label>
      <label className="slider-field">
        {label} cylinder: {eye.cyl.toFixed(2)} D
        <input type="range" min={-6} max={0} step={0.25} value={eye.cyl}
          onChange={(e) => onField(eyeKey, 'cyl', parseFloat(e.target.value))} />
      </label>
      <label className="slider-field">
        {label} axis: {eye.axis}°
        <input type="range" min={0} max={180} step={1} value={eye.axis}
          onChange={(e) => onField(eyeKey, 'axis', parseFloat(e.target.value))} />
      </label>
    </div>
  );
}

export function RxPanel({ rx, onRx }: { rx: Prescription; onRx: (rx: Prescription) => void }) {
  const [open, setOpen] = useState(false);
  const onField = (eyeKey: EyeKey, field: Field, value: number) => {
    onRx({ ...rx, [eyeKey]: { ...rx[eyeKey], [field]: value } });
  };
  return (
    <div>
      <div className="preset-chips">
        {PRESETS.map((p) => (
          <button key={p.id} className="preset-chip" aria-pressed={sameRx(p.rx, rx)} onClick={() => onRx(p.rx)}>
            {p.label}
          </button>
        ))}
      </div>
      <button className="expander" aria-expanded={open} data-testid="finetune-toggle" onClick={() => setOpen((o) => !o)}>
        Fine-tune each eye
        <span className={open ? 'chev chev--open' : 'chev'}><ChevronRight size={16} /></span>
      </button>
      {open && (
        <div className="eye-sliders" data-testid="rx-panel">
          <EyeSliders eyeKey="right" label="Right" eye={rx.right} onField={onField} />
          <EyeSliders eyeKey="left" label="Left" eye={rx.left} onField={onField} />
        </div>
      )}
    </div>
  );
}
