import { loadImage } from './loadImage';

export interface PhotoLoader {
  /** Load a photo, serving repeats (and concurrent calls) from cache. */
  load(src: string): Promise<HTMLImageElement>;
  /** Fire-and-forget warm-up of upcoming photos so Next feels instant. */
  preload(srcs: string[]): void;
}

/**
 * Caches photo loads by src so advancing to a preloaded photo is instant
 * instead of paying a network fetch + decode on click. Promises are cached
 * (not just images) so concurrent loads dedupe; failed loads are evicted so
 * a retry can succeed. The whole bundled set is ~13 MB of compressed JPEG,
 * so an unbounded cache is fine — after one full pass everything is warm.
 */
export function createPhotoLoader(
  loader: (src: string) => Promise<HTMLImageElement> = loadImage,
): PhotoLoader {
  const cache = new Map<string, Promise<HTMLImageElement>>();

  const load = (src: string): Promise<HTMLImageElement> => {
    let pending = cache.get(src);
    if (!pending) {
      pending = loader(src).then((img) => {
        // Decode off the click path where supported; failure is harmless.
        void img.decode?.().catch(() => {});
        return img;
      });
      pending.catch(() => cache.delete(src));
      cache.set(src, pending);
    }
    return pending;
  };

  const preload = (srcs: string[]): void => {
    for (const src of srcs) void load(src).catch(() => {});
  };

  return { load, preload };
}
