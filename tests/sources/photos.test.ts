import { describe, it, expect } from 'vitest';
import { LOCAL_PHOTOS, shuffledPhotos } from '../../src/sources/photos';

describe('local photos', () => {
  it('has a non-empty, well-formed manifest', () => {
    expect(LOCAL_PHOTOS.length).toBeGreaterThan(0);
    for (const p of LOCAL_PHOTOS) {
      expect(p.id).toBeTruthy();
      expect(p.src).toMatch(/^\/photos\/.+\.jpg$/);
      expect(p.creator).toBeTruthy();
      expect(p.creatorUrl).toMatch(/^https:\/\/unsplash\.com\//);
      expect(p.unsplashUrl).toMatch(/^https:\/\/unsplash\.com\//);
    }
  });

  it('has unique photo ids', () => {
    const ids = LOCAL_PHOTOS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shuffledPhotos returns the same set without mutating the source', () => {
    const before = LOCAL_PHOTOS.map((p) => p.id).sort();
    const shuffled = shuffledPhotos();
    expect(shuffled).toHaveLength(LOCAL_PHOTOS.length);
    expect(shuffled.map((p) => p.id).sort()).toEqual(before);
    // original order preserved (not mutated in place)
    expect(LOCAL_PHOTOS.map((p) => p.id).sort()).toEqual(before);
  });
});
