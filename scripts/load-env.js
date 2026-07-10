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
        console.warn(`[SEO Warning] Failed to read environment file at ${envPath}:`, err.message);
      }
    }
  }
  return env;
}

module.exports = { loadEnv };
