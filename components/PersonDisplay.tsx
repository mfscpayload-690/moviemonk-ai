import React, { useState } from 'react';

interface FilmItem {
  id: number;
  title: string;
  year?: number;
  role: string;
  character?: string;
  poster_url?: string;
}

interface PersonPayload {
  person: {
    id: number;
    name: string;
    biography?: string;
    birthday?: string;
    place_of_birth?: string;
    profile_url?: string;
  };
  filmography: FilmItem[];
  sources?: { name: string; url: string }[];
}

// Skeleton card component for loading states
const SkeletonCard: React.FC = () => (
  <div className="rounded-lg border border-white/10 overflow-hidden bg-white/5 animate-pulse">
    <div className="w-full h-40 bg-white/10" />
    <div className="p-2 space-y-2">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
    </div>
  </div>
);

const BIO_LIMIT = 600;

const PersonDisplay: React.FC<{ data: PersonPayload; isLoading?: boolean; onQuickSearch?: (q: string) => void; onBriefMe?: (name: string) => void }>= ({ data, isLoading, onQuickSearch, onBriefMe }) => {
  const [bioExpanded, setBioExpanded] = useState(false);

  if (!data) return null;
  const { person, filmography, sources } = data;

  const bioTruncated = person.biography && person.biography.length > BIO_LIMIT;
  const displayBio = bioExpanded || !bioTruncated ? person.biography : person.biography?.slice(0, BIO_LIMIT) + '…';

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {person.profile_url ? (
          <img
            src={person.profile_url}
            alt={person.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover border border-white/10 shadow-lg"
          />
        ) : (
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-text-dark text-xs">No Photo</div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold">{person.name}</h2>
          <div className="text-sm text-brand-text-dark mt-1">
            {person.birthday && <span>Born: {person.birthday}</span>}
            {person.place_of_birth && <span> • {person.place_of_birth}</span>}
          </div>
          {(onQuickSearch || onBriefMe) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onQuickSearch && (
                <>
                  <button className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/80 text-white text-sm transition" onClick={() => onQuickSearch(`${person.name} best movies`)}>Best Movies</button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-sm transition" onClick={() => onQuickSearch(`Movies by ${person.name}`)}>Movies by {person.name}</button>
                </>
              )}
              {onBriefMe && (
                <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-purple-500 text-white text-sm font-medium shadow hover:shadow-lg transition" onClick={() => onBriefMe(person.name)} aria-label="Brief Me">✨ Brief Me</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Biography */}
      {person.biography && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-lg">Biography</h3>
          <p className="text-sm leading-relaxed text-brand-text-light whitespace-pre-wrap">
            {displayBio}
          </p>
          {bioTruncated && (
            <button className="mt-2 text-brand-primary text-sm hover:underline" onClick={() => setBioExpanded(!bioExpanded)}>
              {bioExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Filmography */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4 text-lg">Filmography</h3>
        {isLoading && filmography.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filmography.map((f) => (
              <div key={`${f.id}-${f.role}`} className="rounded-lg border border-white/10 overflow-hidden bg-white/5 hover:border-brand-primary/50 hover:shadow-md transition group">
                {f.poster_url ? (
                  <img src={f.poster_url} alt={f.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <div className="w-full h-44 bg-white/5 flex items-center justify-center text-xs text-brand-text-dark">No Poster</div>
                )}
                <div className="p-2">
                  <div className="text-sm font-medium truncate" title={f.title}>{f.title}</div>
                  <div className="text-xs text-brand-text-dark">{f.year || '—'} • {f.role}{f.character ? ` as ${f.character}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-2 text-lg">Sources</h3>
          <ul className="list-disc list-inside text-sm text-brand-text-dark">
            {sources.map((s) => (
              <li key={s.url}><a href={s.url} className="text-brand-primary hover:underline" target="_blank" rel="noreferrer">{s.name}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Loading */}
      {isLoading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-brand-text-dark">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          Loading…
        </div>
      )}
    </div>
  );
};

export default PersonDisplay;
