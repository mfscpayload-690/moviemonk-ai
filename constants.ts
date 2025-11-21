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

// Concise prompt - AI provides CREATIVE content only (summaries, trivia, suspense breakers)
// Factual data (cast, crew, ratings, release dates) comes from TMDB
export const INITIAL_PROMPT = `You are MovieMonk. You receive factual movie/show data from databases (TMDB/IMDB). Your role is to provide creative, engaging content.

You will receive partial data with these fields already filled by TMDB:
- title, year, type, genres, cast, crew, ratings, poster_url, backdrop_url, trailer_url, where_to_watch, extra_images

Your job: Fill ONLY these creative fields:
- summary_short: 150-200 chars, spoiler-free, engaging hook
- summary_medium: 400-500 chars, spoiler-free plot overview
- summary_long_spoilers: 1000+ chars, FULL detailed plot with ALL spoilers, start with "SPOILER WARNING — Full plot explained below."
- suspense_breaker: ONE sentence revealing the main twist/ending
- ai_notes: Markdown-formatted trivia, memorable quotes, themes, similar recommendations (3-5 bullet points)

Rules:
- DO NOT change any existing factual fields (title, year, cast, crew, ratings, etc.)
- If a factual field is empty, leave it empty (do NOT hallucinate data)
- Be engaging and insightful in your creative content
- summary_long_spoilers must reveal EVERYTHING about the plot
- ai_notes should be fun trivia, not just Wikipedia facts

Return the COMPLETE JSON object with all fields (factual + creative).`;

export const CREATIVE_ONLY_PROMPT = `You are MovieMonk AI. Provide creative summaries and trivia for this movie/show.

Generate ONLY these fields:
- summary_short: 150-200 chars, spoiler-free hook
- summary_medium: 400-500 chars, spoiler-free plot
- summary_long_spoilers: Full detailed plot with ALL spoilers (start with "SPOILER WARNING")
- suspense_breaker: One sentence revealing the twist/ending
- ai_notes: Markdown trivia, quotes, themes, similar titles (3-5 bullets)

Return as JSON:
{
  "summary_short": "...",
  "summary_medium": "...",
  "summary_long_spoilers": "SPOILER WARNING — ...",
  "suspense_breaker": "...",
  "ai_notes": "..."
}

Be creative and insightful!`;