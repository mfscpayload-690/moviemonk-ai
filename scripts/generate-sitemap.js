const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');

const env = loadEnv();
const TMDB_API_KEY = env.TMDB_API_KEY;
const SITE_URL = 'https://moviemonk-ai.vercel.app';

// ── XML Escaper ──────────────────────────────────────────────────────────────
function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchFromTmdb(pathSegment, params = {}) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY environment variable is not defined.');
  }
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params
  }).toString();

  const url = `https://api.themoviedb.org/3/${pathSegment}?${query}`;
  
  // Set up fetch timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`TMDB API request failed with status ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

const CURATED_EVERGREEN_ITEMS = [
  // Popular movies
  { type: 'movie', id: 1058424, priority: '0.8' },
  { type: 'movie', id: 533535, priority: '0.8' },
  { type: 'movie', id: 157336, priority: '0.8' },
  { type: 'movie', id: 27205, priority: '0.8' },
  { type: 'movie', id: 155, priority: '0.8' },
  { type: 'movie', id: 693134, priority: '0.8' },
  { type: 'movie', id: 872585, priority: '0.8' },
  { type: 'movie', id: 945961, priority: '0.8' },
  { type: 'movie', id: 1022789, priority: '0.8' },
  { type: 'movie', id: 1184918, priority: '0.8' },
  { type: 'movie', id: 603, priority: '0.8' },
  { type: 'movie', id: 19995, priority: '0.8' },
  // Popular TV series
  { type: 'tv', id: 1399, priority: '0.8' },
  { type: 'tv', id: 94605, priority: '0.8' },
  { type: 'tv', id: 66732, priority: '0.8' },
  { type: 'tv', id: 1396, priority: '0.8' },
  { type: 'tv', id: 94997, priority: '0.8' },
  { type: 'tv', id: 100088, priority: '0.8' },
  { type: 'tv', id: 76479, priority: '0.8' },
  { type: 'tv', id: 93405, priority: '0.8' },
  { type: 'tv', id: 202250, priority: '0.8' },
  { type: 'tv', id: 114472, priority: '0.8' },
  { type: 'tv', id: 119051, priority: '0.8' },
  // Popular actors / people
  { type: 'person', id: 6193, priority: '0.6' },
  { type: 'person', id: 976, priority: '0.6' },
  { type: 'person', id: 1245, priority: '0.6' },
  { type: 'person', id: 18918, priority: '0.6' },
  { type: 'person', id: 3223, priority: '0.6' },
  { type: 'person', id: 11701, priority: '0.6' },
  { type: 'person', id: 500, priority: '0.6' },
  { type: 'person', id: 1136406, priority: '0.6' }
];

async function generateSitemap() {
  console.log('[SEO] Starting sitemap generation...');
  // Only 100% indexable canonical URLs should be in the sitemap.
  // Private / noindex routes (/search, /watchlists, /settings, /auth) are excluded.
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' }
  ];

  if (!TMDB_API_KEY) {
    console.warn('[SEO Warning] TMDB_API_KEY is not defined. Populating sitemap with curated evergreen popular titles.');
    CURATED_EVERGREEN_ITEMS.forEach(item => {
      urls.push({
        loc: `${SITE_URL}/${item.type}/${item.id}`,
        changefreq: 'weekly',
        priority: item.priority
      });
    });
    console.log(`[SEO] Compiled ${urls.length} indexable URLs using curated library.`);
  } else {
    try {
      console.log('[SEO] Fetching trending movies from TMDB...');
      const movies = await fetchFromTmdb('trending/movie/week');
      if (Array.isArray(movies.results)) {
        movies.results.slice(0, 50).forEach(movie => {
          if (movie.id) {
            urls.push({
              loc: `${SITE_URL}/movie/${movie.id}`,
              changefreq: 'weekly',
              priority: '0.8'
            });
          }
        });
        console.log(`[SEO] Added ${movies.results.length} movie URLs to sitemap.`);
      }

      console.log('[SEO] Fetching trending TV shows from TMDB...');
      const shows = await fetchFromTmdb('trending/tv/week');
      if (Array.isArray(shows.results)) {
        shows.results.slice(0, 50).forEach(show => {
          if (show.id) {
            urls.push({
              loc: `${SITE_URL}/tv/${show.id}`,
              changefreq: 'weekly',
              priority: '0.8'
            });
          }
        });
        console.log(`[SEO] Added ${shows.results.length} TV show URLs to sitemap.`);
      }

      console.log('[SEO] Fetching popular people from TMDB...');
      const people = await fetchFromTmdb('person/popular');
      if (Array.isArray(people.results)) {
        people.results.slice(0, 50).forEach(person => {
          if (person.id) {
            urls.push({
              loc: `${SITE_URL}/person/${person.id}`,
              changefreq: 'weekly',
              priority: '0.6'
            });
          }
        });
        console.log(`[SEO] Added ${people.results.length} actor/person URLs to sitemap.`);
      }
    } catch (err) {
      console.error('[SEO Error] Failed to fetch dynamic items from TMDB:', err.message);
      console.warn('[SEO Warning] Sitemap generation falling back to curated evergreen library.');
      CURATED_EVERGREEN_ITEMS.forEach(item => {
        urls.push({
          loc: `${SITE_URL}/${item.type}/${item.id}`,
          changefreq: 'weekly',
          priority: item.priority
        });
      });
      console.log(`[SEO] Compiled ${urls.length} indexable URLs using curated fallback.`);
    }
  }

  // Build XML structure
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${escapeXml(url.lastmod)}</lastmod>\n`;
    }
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`[SEO Success] Sitemap written to ${outputPath} (${urls.length} URLs compiled).`);
}

generateSitemap().catch(err => {
  console.error('[SEO Error] Sitemap compilation failed unexpectedly:', err);
  process.exit(1);
});
