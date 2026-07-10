import { LOCAL_PHOTOS } from './localPhotos';
import type { Photo } from './localPhotos';

export type { Photo };
export { LOCAL_PHOTOS };

/** A shuffled copy of the bundled Unsplash photo set (Fisher–Yates). */
export function shuffledPhotos(): Photo[] {
  const a = [...LOCAL_PHOTOS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
