import * as fs from 'fs';
import * as path from 'path';

describe('App header', () => {
  it('wires the new more menu instead of standalone utility header buttons', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'App-Responsive.tsx'), 'utf8');

    expect(source).toContain('<HeaderUtilityMenu');
    expect(source).not.toContain('aria-label="Open watch later"');
    expect(source).not.toContain('aria-label="Open notifications"');
    expect(source).not.toContain('aria-label="Share this result"');
  });
});
