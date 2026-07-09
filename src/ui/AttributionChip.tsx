import type { Photo } from '../sources/openverse';

export function AttributionChip({ photo }: { photo: Photo }) {
  return (
    <div className="attribution" data-testid="attribution">
      <div>
        “{photo.title}” by {photo.creator}
      </div>
      <div>
        {photo.license} ·{' '}
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
          view source
        </a>
      </div>
    </div>
  );
}
