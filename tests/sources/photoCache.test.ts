import { describe, it, expect, vi } from 'vitest';
import { createPhotoLoader } from '../../src/sources/photoCache';

const fakeImg = () => ({}) as HTMLImageElement;

describe('createPhotoLoader', () => {
  it('loads each src once and serves repeats from cache', async () => {
    const loader = vi.fn((src: string) => Promise.resolve(Object.assign(fakeImg(), { src })));
    const photos = createPhotoLoader(loader);
    const a1 = await photos.load('/photos/a.jpg');
    const a2 = await photos.load('/photos/a.jpg');
    expect(a1).toBe(a2);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent in-flight loads of the same src', async () => {
    const loader = vi.fn(() => new Promise<HTMLImageElement>((r) => setTimeout(() => r(fakeImg()), 5)));
    const photos = createPhotoLoader(loader);
    const [x, y] = await Promise.all([photos.load('/p.jpg'), photos.load('/p.jpg')]);
    expect(x).toBe(y);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('preload warms the cache so a later load makes no new request', async () => {
    const loader = vi.fn((src: string) => Promise.resolve(Object.assign(fakeImg(), { src })));
    const photos = createPhotoLoader(loader);
    photos.preload(['/photos/b.jpg', '/photos/c.jpg']);
    expect(loader).toHaveBeenCalledTimes(2);
    await photos.load('/photos/b.jpg');
    expect(loader).toHaveBeenCalledTimes(2); // no re-fetch
  });

  it('evicts failed loads so a retry can succeed', async () => {
    const loader = vi
      .fn<(src: string) => Promise<HTMLImageElement>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(fakeImg());
    const photos = createPhotoLoader(loader);
    await expect(photos.load('/flaky.jpg')).rejects.toThrow('network');
    await expect(photos.load('/flaky.jpg')).resolves.toBeTruthy();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
