import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SeasonSelector } from '../../components/SeasonSelector';

describe('SeasonSelector Component', () => {
  it('renders correctly with total seasons number', () => {
    const html = renderToStaticMarkup(
      <SeasonSelector
        seasons={5}
        selectedSeason={1}
        onSelectSeason={() => {}}
      />
    );

    expect(html).toContain('Season 1');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders correctly with SeasonItem array including episode counts', () => {
    const seasons = [
      { number: 1, episodeCount: 10 },
      { number: 2, episodeCount: 12 },
    ];

    const html = renderToStaticMarkup(
      <SeasonSelector
        seasons={seasons}
        selectedSeason={2}
        onSelectSeason={() => {}}
      />
    );

    expect(html).toContain('Season 2 • 12 eps');
    expect(html).toContain('aria-label="Select Season"');
  });

  it('renders custom labels if provided in SeasonItem', () => {
    const seasons = [
      { number: 1, label: 'Special Edition 1' },
      { number: 2, label: 'Special Edition 2' },
    ];

    const html = renderToStaticMarkup(
      <SeasonSelector
        seasons={seasons}
        selectedSeason={1}
        onSelectSeason={() => {}}
      />
    );

    expect(html).toContain('Special Edition 1');
  });
});

