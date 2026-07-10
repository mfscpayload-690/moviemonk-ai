const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://moviemonk-ai.vercel.app';
const HOSTNAME = 'moviemonk-ai.vercel.app';

async function pingIndexNow() {
  console.log('[SEO] Starting IndexNow crawl submission...');

  const keyFilePath = path.join(__dirname, '../public/indexnow-key.txt');
  if (!fs.existsSync(keyFilePath)) {
    console.error('[SEO Error] IndexNow key file not found at public/indexnow-key.txt. Please run generate-indexnow.js first.');
    process.exit(1);
  }

  const key = fs.readFileSync(keyFilePath, 'utf8').trim();
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('[SEO Error] Sitemap file not found at public/sitemap.xml. Please run generate-sitemap.js first.');
    process.exit(1);
  }

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  
  // Extract URLs using RegExp
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(sitemapContent)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  if (urls.length === 0) {
    console.warn('[SEO Warning] No URLs found in sitemap.xml to submit.');
    return;
  }

  console.log(`[SEO] Extracted ${urls.length} URLs for IndexNow submission.`);

  const payload = {
    host: HOSTNAME,
    key: key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls
  };

  const indexNowApiUrl = 'https://api.indexnow.org/indexnow';
  console.log(`[SEO] Pinging IndexNow at ${indexNowApiUrl}...`);

  try {
    const res = await fetch(indexNowApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`[SEO Success] IndexNow successfully accepted ${urls.length} URLs! status: ${res.status}`);
    } else {
      const responseText = await res.text();
      console.error(`[SEO Error] IndexNow submission failed. status: ${res.status}, response: ${responseText}`);
    }
  } catch (err) {
    console.error('[SEO Error] IndexNow API request failed:', err.message);
  }
}

pingIndexNow().catch(err => {
  console.error('[SEO Error] IndexNow submission failed unexpectedly:', err);
  process.exit(1);
});
