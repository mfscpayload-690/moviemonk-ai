import { safeImgUrl } from '../../lib/seo';

describe('safeImgUrl', () => {
  it('should allow safe relative paths and reject protocol-relative paths', () => {
    expect(safeImgUrl('/assets/poster.jpg')).toBe('/assets/poster.jpg');
    expect(safeImgUrl('/nested/path/image.png')).toBe('/nested/path/image.png');
    expect(safeImgUrl('//evil.com/poster.jpg')).toBe('');
  });

  it('should allow valid data:image base64 URLs and reject other data: protocols', () => {
    const validDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(safeImgUrl(validDataUrl)).toBe(validDataUrl);
    expect(safeImgUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('');
  });

  it('should reject dangerous protocols like javascript:', () => {
    expect(safeImgUrl('javascript:alert(1)')).toBe('');
    expect(safeImgUrl('javascript://alert(1)')).toBe('');
    expect(safeImgUrl('vbscript:msgbox(1)')).toBe('');
  });

  it('should allow whitelisted external domains', () => {
    expect(safeImgUrl('https://image.tmdb.org/t/p/w500/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
    expect(safeImgUrl('https://static.tvmaze.com/uploads/images/medium_portrait/1/3.jpg')).toBe('https://static.tvmaze.com/uploads/images/medium_portrait/1/3.jpg');
    expect(safeImgUrl('https://images.unsplash.com/photo-123456')).toBe('https://images.unsplash.com/photo-123456');
    expect(safeImgUrl('https://lh3.googleusercontent.com/a/ACg8ocL3')).toBe('https://lh3.googleusercontent.com/a/ACg8ocL3');
    expect(safeImgUrl('https://avatars.githubusercontent.com/u/9919')).toBe('https://avatars.githubusercontent.com/u/9919');
    expect(safeImgUrl('https://projectref.supabase.co/storage/v1/object/public/avatars/avatar.jpg')).toBe('https://projectref.supabase.co/storage/v1/object/public/avatars/avatar.jpg');
    expect(safeImgUrl('https://moviemonk-ai.vercel.app/logo.png')).toBe('https://moviemonk-ai.vercel.app/logo.png');
    expect(safeImgUrl('http://localhost:3000/avatar.png')).toBe('http://localhost:3000/avatar.png');
  });

  it('should reject non-whitelisted external domains', () => {
    expect(safeImgUrl('https://evil.com/avatar.png')).toBe('');
    expect(safeImgUrl('https://attacker.com/image.tmdb.org/avatar.png')).toBe('');
    expect(safeImgUrl('https://image.tmdb.org.evil.com/avatar.png')).toBe('');
  });

  it('should return fallback for null, undefined, or empty values', () => {
    expect(safeImgUrl(null, 'fallback.png')).toBe('fallback.png');
    expect(safeImgUrl(undefined, 'fallback.png')).toBe('fallback.png');
    expect(safeImgUrl('', 'fallback.png')).toBe('fallback.png');
  });
});
