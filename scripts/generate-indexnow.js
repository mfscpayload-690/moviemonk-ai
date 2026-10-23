const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');
const env = loadEnv();
const rawKey = (env.INDEXNOW_KEY || env.VITE_INDEXNOW_KEY || '').trim();
const isValidKey = /^[a-zA-Z0-9_-]{8,128}$/.test(rawKey);

function generateIndexNow() {
  console.log('[SEO] Starting IndexNow key verification file generation...');
  
  if (!rawKey) {
    console.warn('[SEO Warning] INDEXNOW_KEY / VITE_INDEXNOW_KEY is not defined. Skipping IndexNow verification file generation.');
    return;
  }

  if (!isValidKey) {
    console.warn('[SEO Warning] Provided IndexNow key is invalid (must be 8-128 alphanumeric characters). Skipping IndexNow verification file generation.');
    return;
  }

  const keyFilename = `${rawKey}.txt`;
  const keyFilePath = path.join(__dirname, '../public', keyFilename);
  const infoFilePath = path.join(__dirname, '../public/indexnow-key.txt');

  // Write the IndexNow key verification file
  fs.writeFileSync(keyFilePath, rawKey, 'utf8');
  console.log('[SEO Success] Created IndexNow verification file in public directory.');

  // Write key to indexnow-key.txt for ping script reference
  fs.writeFileSync(infoFilePath, rawKey, 'utf8');
}

try {
  generateIndexNow();
} catch (err) {
  console.error('[SEO Error] Failed to generate IndexNow verification files:', err.message);
  process.exit(1);
}
