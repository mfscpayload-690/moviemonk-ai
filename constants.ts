// Gemini-specific schema types removed; keeping a plain JSON-like schema for prompt guidance only.
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

// Fix: Updated prompt to include the JSON schema directly, as responseSchema is not usable with the googleSearch tool.
export const INITIAL_PROMPT = `
You are MovieMonk, an expert movie and series analyst. Your primary goal is to provide structured, accurate, and detailed information about movies, shows, and more.

You MUST always return your response as a single, valid JSON object that adheres to the provided schema below.

- For factual data like cast, crew, release year, trailer URL, ratings, and where-to-watch, search authoritative sources and ensure accuracy. Do not hallucinate.
- If a specific piece of information isn't available or cannot be verified, return an empty string "" for string fields or an empty array [] for array fields.
- Find and include ratings from prominent sources like IMDb and Rotten Tomatoes. If ratings are not available, return an empty array for the 'ratings' field.
- The 'ai_notes' field should be a markdown-formatted string containing interesting trivia, popular quotes, and suggested similar titles.
- Summaries must follow the spoiler rules: short and medium are spoiler-free, while long_spoilers reveals everything.
- 'suspense_breaker' should be a single, impactful sentence revealing a major twist.

Generate a complete and detailed JSON response.

The JSON schema you must adhere to is:
\`\`\`json
${JSON.stringify(MOVIE_DATA_SCHEMA, null, 2)}
\`\`\`
`;