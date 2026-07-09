import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPhotos } from '../../src/sources/openverse';

afterEach(() => vi.restoreAllMocks());

describe('fetchPhotos', () => {
  it('maps Openverse results to Photo with formatted license and thumbnail url', async () => {
    const mockJson = {
      results: [
        {
          id: 'abc',
          url: 'https://example.com/full.jpg',
          thumbnail: 'https://api.openverse.org/v1/images/abc/thumb/',
          creator: 'Jane Doe',
          license: 'by',
          license_version: '4.0',
          license_url: 'https://creativecommons.org/licenses/by/4.0/',
          foreign_landing_url: 'https://example.com/photo',
          title: 'A View',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockJson) }),
    );
    const photos = await fetchPhotos('landscape');
    expect(photos).toHaveLength(1);
    expect(photos[0].url).toBe('https://api.openverse.org/v1/images/abc/thumb/');
    expect(photos[0].creator).toBe('Jane Doe');
    expect(photos[0].license).toBe('CC BY 4.0');
    expect(photos[0].sourceUrl).toBe('https://example.com/photo');
  });

  it('formats the cc0 license as "CC0" without a duplicated "CC" prefix', async () => {
    const mockJson = {
      results: [
        {
          id: 'def',
          url: 'https://example.com/full2.jpg',
          thumbnail: 'https://api.openverse.org/v1/images/def/thumb/',
          creator: 'John Smith',
          license: 'cc0',
          license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
          foreign_landing_url: 'https://example.com/photo2',
          title: 'Public Domain Shot',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockJson) }),
    );
    const photos = await fetchPhotos('landscape');
    expect(photos[0].license).toBe('CC0');
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchPhotos('x')).rejects.toThrow('429');
  });
});
