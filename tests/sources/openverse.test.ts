import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPhotos, fetchPhotoPool } from '../../src/sources/openverse';

afterEach(() => vi.restoreAllMocks());

// Build an OpenverseResult with just the fields toPhoto needs.
function result(id: string) {
  return { id, thumbnail: `https://cdn/${id}`, license: 'by', foreign_landing_url: `https://src/${id}` };
}

// Mock fetch that returns category-specific results keyed by the `q` param.
function mockFetchByQuery(byQuery: Record<string, ReturnType<typeof result>[]>) {
  return vi.fn((url: string) => {
    const q = new URL(url).searchParams.get('q') ?? '';
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ results: byQuery[q] ?? [] }) });
  });
}

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

describe('fetchPhotoPool', () => {
  it('merges photos from several distinct categories into one pool', async () => {
    // random=0 makes pickDistinct choose the first N queries: landscape, street, city.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      mockFetchByQuery({
        landscape: [result('l1'), result('l2')],
        street: [result('s1'), result('s2')],
        city: [result('c1'), result('c2')],
      }),
    );
    const pool = await fetchPhotoPool(3, 2);
    const ids = pool.map((p) => p.id).sort();
    expect(ids).toEqual(['c1', 'c2', 'l1', 'l2', 's1', 's2']);
  });

  it('dedupes photos that appear in more than one category', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      mockFetchByQuery({
        landscape: [result('dup'), result('l2')],
        street: [result('dup'), result('s2')],
        city: [result('c1')],
      }),
    );
    const pool = await fetchPhotoPool(3, 2);
    const ids = pool.map((p) => p.id).sort();
    expect(ids).toEqual(['c1', 'dup', 'l2', 's2']);
  });

  it('tolerates a failing category without dropping the whole pool', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        const q = new URL(url).searchParams.get('q');
        if (q === 'street') return Promise.resolve({ ok: false, status: 500 });
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [result(q as string)] }),
        });
      }),
    );
    const pool = await fetchPhotoPool(3, 2);
    const ids = pool.map((p) => p.id).sort();
    expect(ids).toEqual(['city', 'landscape']); // street failed, others survived
  });
});
