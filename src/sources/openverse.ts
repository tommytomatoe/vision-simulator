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
  return data.results.map(toPhoto).filter((p) => !!p.url);
}

function toPhoto(r: OpenverseResult): Photo {
  const license = `CC ${r.license.toUpperCase()}${r.license_version ? ' ' + r.license_version : ''}`;
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
