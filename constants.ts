// Schema guidance for AI providers (Groq, Mistral, OpenRouter)
export const MOVIE_DATA_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'The official title of the movie/show.' },
    year: { type: 'string', description: 'The release year.' },
    type: { type: 'string', description: "The type of content (e.g., 'movie', 'show')." },
    genres: {
      type: 'array',
      items: { type: 'string' },
      description: 'A list of genres.'
    },
    poster_url: { type: 'string', description: 'URL to a high-quality poster image.' },
    backdrop_url: { type: 'string', description: 'URL to a high-quality backdrop image.' },
    trailer_url: { type: 'string', description: 'YouTube trailer URL or empty string.' },
    ratings: {
      type: 'array',
      description: 'Ratings like IMDb, Rotten Tomatoes.',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          score: { type: 'string' }
        },
        required: ['source', 'score']
      }
    },
    cast: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          known_for: { type: 'string' }
        },
        required: ['name', 'role', 'known_for']
      }
    },
    crew: {
      type: 'object',
      properties: {
        director: { type: 'string' },
        writer: { type: 'string' },
        music: { type: 'string' }
      },
      required: ['director', 'writer', 'music']
    },
    summary_short: { type: 'string' },
    summary_medium: { type: 'string' },
    summary_long_spoilers: { type: 'string' },
    suspense_breaker: { type: 'string' },
    where_to_watch: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          link: { type: 'string' },
          type: { type: 'string' }
        },
        required: ['platform', 'link', 'type']
      }
    },
    extra_images: {
      type: 'array',
      items: { type: 'string' }
    },
    ai_notes: { type: 'string' }
  },
  required: ['title','year','type','genres','poster_url','backdrop_url','cast','crew','summary_short','summary_medium','summary_long_spoilers','suspense_breaker','where_to_watch','extra_images','ai_notes','trailer_url','ratings']
};

// Concise prompt - removed embedded schema to reduce token count by ~50%
export const INITIAL_PROMPT = `You are MovieMonk. Return ONLY a valid JSON object with movie/show data. No explanations, no markdown.

Required fields: title, year, type, genres, poster_url, backdrop_url, trailer_url, ratings (IMDb, RT), cast (name, role, known_for), crew (director, writer, music), summary_short, summary_medium, summary_long_spoilers, suspense_breaker, where_to_watch (platform, link, type: subscription|rent|buy|free), extra_images, ai_notes (markdown trivia/quotes/similar titles).

Rules:
- Use Google Search for facts. No hallucinations.
- Empty string "" or [] if data unavailable
- Summaries: short/medium are spoiler-free, long_spoilers reveals all
- suspense_breaker: one sentence twist reveal

Return valid JSON only.`;