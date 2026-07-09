import type { SourceKind } from './types';
import { CameraIcon, ShapesIcon, ImageIcon, ChevronDown } from './icons';

export function SourceChip({
  kind,
  sceneLabel,
  onOpen,
}: {
  kind: SourceKind;
  sceneLabel: string;
  onOpen: () => void;
}) {
  const icon = kind === 'camera' ? <CameraIcon size={15} /> : kind === 'scene' ? <ShapesIcon size={15} /> : <ImageIcon size={15} />;
  const label = kind === 'camera' ? 'Camera' : kind === 'scene' ? sceneLabel : 'Photos';
  return (
    <button className="source-chip" onClick={onOpen} aria-label={`Source: ${label}. Open settings`}>
      {icon}
      <span>{label}</span>
      <ChevronDown size={13} />
    </button>
  );
}
