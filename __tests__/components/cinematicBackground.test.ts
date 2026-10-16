import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CinematicBackground from '../../components/CinematicBackground';

describe('CinematicBackground Component', () => {
  it('renders a canvas element with cinematic-canvas class and aria-hidden', () => {
    const html = renderToStaticMarkup(
      React.createElement(CinematicBackground, {})
    );

    expect(html).toContain('<canvas');
    expect(html).toContain('class="cinematic-canvas"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders properly with interactiveTarget and targetType props provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CinematicBackground, {
        interactiveTarget: { x: 350, y: 400 },
        targetType: 'google'
      })
    );

    expect(html).toContain('class="cinematic-canvas"');
  });

  it('renders properly when targetType is github', () => {
    const html = renderToStaticMarkup(
      React.createElement(CinematicBackground, {
        interactiveTarget: { x: 350, y: 400 },
        targetType: 'github'
      })
    );

    expect(html).toContain('class="cinematic-canvas"');
  });
});
