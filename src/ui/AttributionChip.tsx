import type { Photo } from '../sources/photos';

export function AttributionChip({ photo }: { photo: Photo }) {
  return (
    <div className="caption" data-testid="attribution">
      Photo by{' '}
      <a href={photo.creatorUrl} target="_blank" rel="noreferrer">
        {photo.creator}
      </a>{' '}
      on{' '}
      <a href={photo.unsplashUrl} target="_blank" rel="noreferrer">
        Unsplash
      </a>
    </div>
  );
}
