import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadPreferenceSettings } from '../lib/userSettings';

type PersonalizedFeedPanelProps = {
  onRunQuery: (query: string) => void;
};

export default function PersonalizedFeedPanel({ onRunQuery }: PersonalizedFeedPanelProps) {
  const { user } = useAuth();
  const preferences = loadPreferenceSettings();

  if (!user) {
    return (
      <section className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
        <h2 className="text-white font-semibold mb-1">Guest mode</h2>
        <p className="text-brand-text-light text-sm">
          Sign in to unlock personalized discovery and synced watchlists.
        </p>
      </section>
    );
  }

  const featuredQueries: string[] = [];
  if (preferences.genres[0]) {
    featuredQueries.push(`Best ${preferences.genres[0]} movies`);
  }
  if (preferences.languages[0]) {
    featuredQueries.push(`Top ${preferences.languages[0]} language films`);
  }
  if (preferences.favoriteDecades[0]) {
    featuredQueries.push(`Must-watch ${preferences.favoriteDecades[0]} classics`);
  }

  if (featuredQueries.length === 0) {
    return (
      <section className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
        <h2 className="text-white font-semibold mb-1">Personalize your feed</h2>
        <p className="text-brand-text-light text-sm mb-3">
          Add your genres and language preferences for curated discovery rows.
        </p>
        <Link to="/settings/preferences" className="btn-primary inline-flex">
          Open preferences
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-white font-semibold">Personalized for you</h2>
        <Link to="/settings/preferences" className="text-sm text-brand-text-light hover:text-white">
          Tune preferences
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {featuredQueries.map((query) => (
          <button
            type="button"
            key={query}
            className="px-3 py-1.5 rounded-full border border-brand-primary/40 text-sm text-white hover:bg-brand-primary/20"
            onClick={() => onRunQuery(query)}
          >
            {query}
          </button>
        ))}
      </div>
    </section>
  );
}
