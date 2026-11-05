import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppFooter } from '../../components/footer/AppFooter';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  )
}));

describe('AppFooter Component', () => {
  it('renders brand signature and clean tagline', () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain('Movie');
    expect(html).toContain('Monk');
    expect(html).toContain('AI-powered cinematic discovery &amp; curated archives');
  });

  it('renders clean navigation links', () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/watchlists"');
    expect(html).toContain('href="/settings"');
    expect(html).toContain('Home');
    expect(html).toContain('Watchlists');
    expect(html).toContain('Settings');
  });

  it('renders TMDB attribution and GitHub contribute link', () => {
    const html = renderToStaticMarkup(<AppFooter />);

    expect(html).toContain('TMDB');
    expect(html).toContain('https://github.com/mfscpayload-690/moviemonk-ai');
    expect(html).toContain('Contribute');
    expect(html).toContain('MIT License');
  });

  it('contains strictly zero raw unicode emojis', () => {
    const html = renderToStaticMarkup(<AppFooter />);

    // Verify no emoji unicode ranges in output
    expect(html).not.toMatch(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
  });
});
