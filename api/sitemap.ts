import type { VercelRequest, VercelResponse } from './_utils/vercel';
import { applyCors } from './_utils/cors';
import { SITE_URL, escapeXml } from '../lib/seo';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const MAX_URLS_PER_BUCKET = 20;

type TmdbMediaItem = {
  id: number;
};

type SitemapUrl = {
  loc: string;
  changefreq: 'daily' | 'weekly';
  priority: string;
  lastmod: string;
};

async function tmdb(path: string): Promise<any> {
  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_TOKEN;
  const url = new URL(`${TMDB_BASE}/${path}`);

  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
  }

  const headers: Record<string, string> = readToken
    ? { Authorization: `Bearer ${readToken}` }
    : {};

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB request failed for ${path} (${response.status})`);
  }

  return response.json();
}

function buildUrlEntry(path: string, changefreq: SitemapUrl['changefreq'], priority: string): SitemapUrl {
  return {
    loc: `${SITE_URL}${path}`,
    changefreq,
    priority,
    lastmod: new Date().toISOString()
  };
}

function dedupeUrls(urls: SitemapUrl[]): SitemapUrl[] {
  const seen = new Set<string>();
  return urls.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

function xmlForUrls(urls: SitemapUrl[]): string {
  const body = urls.map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originAllowed } = applyCors(req, res, 'GET, OPTIONS');
  if (req.headers.origin && !originAllowed) {
    return res.status(403).json({ ok: false, error: 'Origin is not allowed' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET supported' });

  try {
    const [movies, tv, people] = await Promise.all([
      tmdb('trending/movie/week'),
      tmdb('trending/tv/week'),
      tmdb('trending/person/week')
    ]);

    const urls: SitemapUrl[] = [
      buildUrlEntry('/', 'daily', '1.0'),
      ...(movies?.results || [])
        .slice(0, MAX_URLS_PER_BUCKET)
        .map((item: TmdbMediaItem) => buildUrlEntry(`/movie/${item.id}`, 'daily', '0.9')),
      ...(tv?.results || [])
        .slice(0, MAX_URLS_PER_BUCKET)
        .map((item: TmdbMediaItem) => buildUrlEntry(`/tv/${item.id}`, 'daily', '0.8')),
      ...(people?.results || [])
        .slice(0, MAX_URLS_PER_BUCKET)
        .map((item: TmdbMediaItem) => buildUrlEntry(`/person/${item.id}`, 'weekly', '0.7'))
    ];

    const xml = xmlForUrls(dedupeUrls(urls));

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to generate sitemap'
    });
  }
}
