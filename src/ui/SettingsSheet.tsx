import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SourceKind } from './types';
import type { EyeSelection, Prescription } from '../optics/types';
import { CameraIcon, EyeIcon, ImageIcon } from './icons';
import { EyeToggle } from './EyeToggle';
import { RxPanel } from './RxPanel';

const SOURCES: { value: SourceKind; label: string; icon: ReactNode }[] = [
  { value: 'camera', label: 'Camera', icon: <CameraIcon size={15} /> },
  { value: 'scene', label: 'Eye Test', icon: <EyeIcon size={15} /> },
  { value: 'photo', label: 'Photos', icon: <ImageIcon size={15} /> },
];

export function SettingsSheet({
  open,
  onClose,
  kind,
  onKind,
  selection,
  onSelection,
  rx,
  onRx,
}: {
  open: boolean;
  onClose: () => void;
  kind: SourceKind;
  onKind: (k: SourceKind) => void;
  selection: EyeSelection;
  onSelection: (v: EyeSelection) => void;
  rx: Prescription;
  onRx: (rx: Prescription) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-scrim" data-testid="settings-scrim" onClick={onClose}>
      <div
        className="sheet"
        data-testid="settings-sheet"
        role="dialog"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-body">
          <section className="section">
            <div className="section-label">Source</div>
            <div className="seg" role="group" aria-label="Source">
              {SOURCES.map((s) => (
                <button key={s.value} aria-pressed={kind === s.value} onClick={() => onKind(s.value)}>
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-label">Eyes</div>
            <EyeToggle value={selection} onChange={onSelection} />
            {selection === 'both' && (
              <p className="hint" data-testid="both-hint">“Both” is an approximate blend of the two eyes.</p>
            )}
          </section>

          <section className="section">
            <div className="section-label">Prescription</div>
            <RxPanel rx={rx} onRx={onRx} />
          </section>

          <button className="done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
