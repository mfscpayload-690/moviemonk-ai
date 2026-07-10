const fs = require('fs');
const path = require('path');

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
        // Silent catch
      }
    }
  }
  return env;
}

const env = loadEnv();
// Fallback to a stable default key if VITE_INDEXNOW_KEY is not defined
const INDEXNOW_KEY = env.VITE_INDEXNOW_KEY || 'moviemonkai123indexnowkey';

function generateIndexNow() {
  console.log('[SEO] Starting IndexNow key verification file generation...');
  
  if (!env.VITE_INDEXNOW_KEY) {
    console.warn('[SEO Warning] VITE_INDEXNOW_KEY is not defined in environment. Using stable default key.');
  }

  const keyFilename = `${INDEXNOW_KEY}.txt`;
  const keyFilePath = path.join(__dirname, '../public', keyFilename);
  const infoFilePath = path.join(__dirname, '../public/indexnow-key.txt');

  // Write the IndexNow key verification file
  fs.writeFileSync(keyFilePath, INDEXNOW_KEY, 'utf8');
  console.log(`[SEO Success] Created IndexNow verification file at public/${keyFilename}`);

  // Write key to indexnow-key.txt for ping script reference
  fs.writeFileSync(infoFilePath, INDEXNOW_KEY, 'utf8');
}

try {
  generateIndexNow();
} catch (err) {
  console.error('[SEO Error] Failed to generate IndexNow verification files:', err.message);
  process.exit(1);
}
