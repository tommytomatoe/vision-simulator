import type { Photo } from '../sources/openverse';

export function AttributionChip({ photo }: { photo: Photo }) {
  return (
    <div className="caption" data-testid="attribution">
      <span className="who">{photo.creator}</span>
      {' · '}
      {photo.title}
      {' · '}
      {photo.license}
      {' · '}
      <a href={photo.sourceUrl} target="_blank" rel="noreferrer">source</a>
    </div>
  );
}
