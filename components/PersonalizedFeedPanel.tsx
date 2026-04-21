import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadPreferenceSettings } from '../lib/userSettings';
import type { WatchlistFolder } from '../types';

type PersonalizedFeedPanelProps = {
  onRunQuery: (query: string) => void;
  onOpenTitle?: (item: { id: number; mediaType: 'movie' | 'tv' }) => void;
  watchlists?: WatchlistFolder[];
};

type FeedCandidate = {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  year?: string;
  posterUrl?: string;
  genres: string[];
  language?: string;
};

function collectCandidates(watchlists: WatchlistFolder[]): FeedCandidate[] {
  const seen = new Set<string>();
  const out: FeedCandidate[] = [];

  watchlists.forEach((folder) => {
    folder.items.forEach((entry) => {
      const movie = entry.movie;
      const id = Number(movie.tmdb_id);
      if (!Number.isFinite(id)) return;
      const mediaType = movie.type === 'show' ? 'tv' : 'movie';
      const key = `${mediaType}:${id}`;
      if (seen.has(key)) return;
      seen.add(key);

      out.push({
        id,
        mediaType,
        title: movie.title,
        year: movie.year,
        posterUrl: movie.poster_url,
        genres: Array.isArray(movie.genres) ? movie.genres : [],
        language: movie.language
      });
    });
  });

  return out.slice(0, 18);
}

function buildWatchlistAwareQueries(candidates: FeedCandidate[], fallbackGenres: string[]): string[] {
  const queries: string[] = [];
  const genreCounts = new Map<string, number>();

  candidates.forEach((item) => {
    item.genres.forEach((genre) => {
      const normalized = genre.trim();
      if (!normalized) return;
      genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1);
    });
  });

  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .slice(0, 2);

  if (candidates[0]) {
    const lead = candidates[0];
    const leadGenre = lead.genres[0] || topGenres[0] || fallbackGenres[0] || 'drama';
    queries.push(`Because I saved ${lead.title}, suggest ${leadGenre} ${lead.mediaType === 'tv' ? 'shows' : 'movies'} like it`);
  }

  topGenres.forEach((genre) => {
    queries.push(`Best recent ${genre} movies and shows with strong ratings`);
  });

  if (candidates[1]) {
    queries.push(`Double feature vibe: ${candidates[0].title} + ${candidates[1].title}`);
  }

  return Array.from(new Set(queries)).slice(0, 4);
}

export default function PersonalizedFeedPanel({ onRunQuery, onOpenTitle, watchlists = [] }: PersonalizedFeedPanelProps) {
  const { user } = useAuth();
  const preferences = loadPreferenceSettings();
  const candidates = collectCandidates(watchlists);

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

  const watchlistAwareQueries = buildWatchlistAwareQueries(candidates, preferences.genres);
  watchlistAwareQueries.forEach((query) => featuredQueries.push(query));

  const dedupedQueries = Array.from(new Set(featuredQueries)).slice(0, 6);

  if (dedupedQueries.length === 0) {
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

      {candidates.length > 0 && (
        <p className="text-xs text-brand-text-light mb-3">
          Watchlist-aware picks: using {Math.min(candidates.length, 12)} saved title{candidates.length === 1 ? '' : 's'} to tune recommendations.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {dedupedQueries.map((query) => (
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

      {candidates.length > 0 && onOpenTitle && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white mb-2">Revisit from your watchlists</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {candidates.slice(0, 4).map((item) => (
              <button
                key={`${item.mediaType}-${item.id}`}
                type="button"
                className="text-left rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 overflow-hidden"
                onClick={() => onOpenTitle({ id: item.id, mediaType: item.mediaType })}
              >
                <div className="aspect-[2/3] bg-black/20">
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={`${item.title} poster`} className="w-full h-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="px-2 py-2">
                  <p className="text-xs text-white line-clamp-2">{item.title}</p>
                  <p className="text-[11px] text-brand-text-light">{item.year || 'TBA'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
