const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('git ls-files "*.ts" "*.tsx" "*.js" "*.css" "*.html"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const emojiRegex = /\p{Extended_Pictographic}/u;
const offenders = [];

for (const file of files) {
  if (file.startsWith('node_modules/') || file.startsWith('dist/')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (emojiRegex.test(content)) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error('Emoji characters found in source files:\n' + offenders.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}

console.log('No emojis detected in source files.');
