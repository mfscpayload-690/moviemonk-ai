const fs = require('fs');
const path = require('path');

// ── Environment Variables Loader ────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            env[key] = value.trim();
          }
        });
      } catch (err) {
        console.warn(`[SEO Warning] Failed to read environment file at ${envPath}:`, err.message);
      }
    }
  }
  return env;
}

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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB API request failed with status ${res.status}`);
  }
  return res.json();
}

async function generateSitemap() {
  console.log('[SEO] Starting sitemap generation...');
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/search`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/watchlists`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${SITE_URL}/settings`, changefreq: 'weekly', priority: '0.5' }
  ];

  if (!TMDB_API_KEY) {
    console.warn('[SEO Warning] TMDB_API_KEY is not defined. Static-only sitemap will be compiled.');
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
              priority: '0.8',
              lastmod: movie.release_date || undefined
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
              priority: '0.8',
              lastmod: show.first_air_date || undefined
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
      console.warn('[SEO Warning] Sitemap generation falling back to static routes only.');
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
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
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
