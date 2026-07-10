const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./load-env');

const env = loadEnv();
const INDEXNOW_KEY = env.VITE_INDEXNOW_KEY;

function generateIndexNow() {
  console.log('[SEO] Starting IndexNow key verification file generation...');
  
  if (!INDEXNOW_KEY) {
    throw new Error('VITE_INDEXNOW_KEY is not defined in the environment. IndexNow verification file generation failed.');
  }

  const keyFilename = `${INDEXNOW_KEY}.txt`;
  const keyFilePath = path.join(__dirname, '../public', keyFilename);
  const infoFilePath = path.join(__dirname, '../public/indexnow-key.txt');

  // Write the IndexNow key verification file
  fs.writeFileSync(keyFilePath, INDEXNOW_KEY, 'utf8');
  console.log('[SEO Success] Created IndexNow verification file in public directory.');

  // Write key to indexnow-key.txt for ping script reference
  fs.writeFileSync(infoFilePath, INDEXNOW_KEY, 'utf8');
}

try {
  generateIndexNow();
} catch (err) {
  console.error('[SEO Error] Failed to generate IndexNow verification files:', err.message);
  process.exit(1);
}
