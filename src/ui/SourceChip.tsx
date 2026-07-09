import type { SourceKind } from './types';
import { CameraIcon, EyeIcon, ImageIcon, ChevronDown } from './icons';

export function SourceChip({
  kind,
  onOpen,
  expanded,
}: {
  kind: SourceKind;
  onOpen: () => void;
  expanded?: boolean;
}) {
  const icon = kind === 'camera' ? <CameraIcon size={15} /> : kind === 'scene' ? <EyeIcon size={15} /> : <ImageIcon size={15} />;
  const label = kind === 'camera' ? 'Camera' : kind === 'scene' ? 'Eye Test' : 'Photos';
  return (
    <button
      className="source-chip"
      onClick={onOpen}
      aria-label={`Source: ${label}. Open settings`}
      aria-haspopup="dialog"
      {...(expanded !== undefined ? { 'aria-expanded': expanded } : {})}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown size={13} />
    </button>
  );
}
