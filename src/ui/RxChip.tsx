import type { Prescription } from '../optics/types';
import { rxLabel } from '../optics/presets';
import { EyeIcon } from './icons';

export function RxChip({ rx, onOpen }: { rx: Prescription; onOpen: () => void }) {
  const label = rxLabel(rx);
  return (
    <button
      className="rx-chip"
      data-testid="rx-chip"
      onClick={onOpen}
      aria-label={`Prescription: ${label}. Open settings`}
      aria-haspopup="dialog"
    >
      <EyeIcon size={13} />
      <span>{label}</span>
    </button>
  );
}
