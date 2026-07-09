export interface Photo {
  id: string;
  url: string; // CORS-safe Openverse thumbnail
  creator: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  title: string;
}

const API = 'https://api.openverse.org/v1/images/';

interface OpenverseResult {
  id: string;
  url: string;
  thumbnail?: string;
  creator?: string;
  license: string;
  license_version?: string;
  license_url?: string;
  foreign_landing_url?: string;
  title?: string;
}

interface OpenverseResponse {
  results: OpenverseResult[];
}

const QUERIES = ['landscape', 'street', 'city', 'nature', 'portrait', 'building', 'interior', 'mountain'];

export async function fetchPhotos(query?: string, pageSize = 12): Promise<Photo[]> {
  const q = query ?? QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const params = new URLSearchParams({
    q,
    page_size: String(pageSize),
    license_type: 'all-cc',
    mature: 'false',
  });
  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) throw new Error(`Openverse request failed: ${res.status}`);
  const data = (await res.json()) as OpenverseResponse;
  return data.results.map(toPhoto);
}

/**
 * Build a mixed, shuffled pool of photos drawn from several distinct random
 * categories at once, so stepping through it feels random and doesn't cluster
 * on one category (as a single-category batch does). Individual category
 * failures are tolerated so one bad request doesn't empty the pool.
 */
export async function fetchPhotoPool(numCategories = 3, perCategory = 8): Promise<Photo[]> {
  const queries = pickDistinct(QUERIES, numCategories);
  const batches = await Promise.all(
    queries.map((q) => fetchPhotos(q, perCategory).catch(() => [] as Photo[])),
  );
  return shuffle(dedupeById(batches.flat()));
}

function pickDistinct<T>(items: readonly T[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function dedupeById(photos: Photo[]): Photo[] {
  const seen = new Set<string>();
  return photos.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toPhoto(r: OpenverseResult): Photo {
  const code = r.license.toUpperCase();
  const base = code === 'CC0' ? 'CC0' : `CC ${code}`;
  const license = `${base}${r.license_version ? ' ' + r.license_version : ''}`;
  return {
    id: r.id,
    url: r.thumbnail || r.url,
    creator: r.creator || 'Unknown',
    license,
    licenseUrl: r.license_url || '',
    sourceUrl: r.foreign_landing_url || r.url,
    title: r.title || 'Untitled',
  };
}
