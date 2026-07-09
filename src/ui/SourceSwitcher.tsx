import { SCENES } from '../sources/scenes';
import type { SourceKind } from './types';

export function SourceSwitcher({
  kind,
  onKind,
  sceneId,
  onScene,
  onShuffle,
}: {
  kind: SourceKind;
  onKind: (k: SourceKind) => void;
  sceneId: string;
  onScene: (id: string) => void;
  onShuffle: () => void;
}) {
  return (
    <div className="row">
      <div className="seg" role="group" aria-label="Source">
        <button aria-pressed={kind === 'camera'} onClick={() => onKind('camera')}>
          Camera
        </button>
        <button aria-pressed={kind === 'scene'} onClick={() => onKind('scene')}>
          Scenes
        </button>
        <button aria-pressed={kind === 'photo'} onClick={() => onKind('photo')}>
          Photos
        </button>
      </div>
      {kind === 'scene' && (
        <div className="seg" role="group" aria-label="Scene">
          {SCENES.map((s) => (
            <button key={s.id} aria-pressed={sceneId === s.id} onClick={() => onScene(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      {kind === 'photo' && (
        <button className="btn" onClick={onShuffle} data-testid="shuffle">
          Next photo →
        </button>
      )}
    </div>
  );
}
