
import { Type } from '@google/genai';

// Fix: Moved MOVIE_DATA_SCHEMA before INITIAL_PROMPT to allow it to be referenced.
export const MOVIE_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The official title of the movie/show." },
    year: { type: Type.STRING, description: "The release year." },
    type: { type: Type.STRING, description: "The type of content (e.g., 'movie', 'show')." },
    genres: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of genres."
    },
    poster_url: { type: Type.STRING, description: "A valid URL to a high-quality poster image." },
    backdrop_url: { type: Type.STRING, description: "A valid URL to a high-quality backdrop/banner image." },
    trailer_url: { type: Type.STRING, description: "A URL to the official movie trailer, preferably from YouTube. Should be an empty string if not found." },
    ratings: {
      type: Type.ARRAY,
      description: "A list of ratings from major sources like IMDb and Rotten Tomatoes. Should be an empty array if not found.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "The name of the rating source (e.g., 'IMDb', 'Rotten Tomatoes')." },
          score: { type: Type.STRING, description: "The rating score as a string (e.g., '8.8/10', '95%')." },
        },
        required: ["source", "score"]
      }
    },
    cast: {
      type: Type.ARRAY,
      description: "List of main cast members.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING, description: "The character they played." },
          known_for: { type: Type.STRING, description: "Another famous work they are known for." },
        },
        required: ["name", "role", "known_for"]
      }
    },
    crew: {
      type: Type.OBJECT,
      properties: {
        director: { type: Type.STRING },
        writer: { type: Type.STRING },
        music: { type: Type.STRING, description: "The main composer." },
      },
      required: ["director", "writer", "music"]
    },
    summary_short: { type: Type.STRING, description: "A 2-3 line, spoiler-free summary." },
    summary_medium: { type: Type.STRING, description: "A one-paragraph, spoiler-free summary." },
    summary_long_spoilers: { type: Type.STRING, description: "A detailed summary including all spoilers and the ending. Must start with 'SPOILER WARNING'." },
    suspense_breaker: { type: Type.STRING, description: "A single sentence that reveals the main twist or spoiler." },
    where_to_watch: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          link: { type: Type.STRING, description: "A direct URL to watch." },
          type: { type: Type.STRING, description: "Type of access (e.g., 'subscription', 'rent')." },
        },
        required: ["platform", "link", "type"]
      }
    },
    extra_images: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "URLs to 2-3 additional high-quality images or stills."
    },
    ai_notes: { type: Type.STRING, description: "Markdown-formatted string with trivia, quotes, and similar titles." }
  },
  required: ["title", "year", "type", "genres", "poster_url", "backdrop_url", "cast", "crew", "summary_short", "summary_medium", "summary_long_spoilers", "suspense_breaker", "where_to_watch", "extra_images", "ai_notes", "trailer_url", "ratings"]
};

// Fix: Updated prompt to include the JSON schema directly, as responseSchema is not usable with the googleSearch tool.
export const INITIAL_PROMPT = `
You are MovieMonk, an expert movie and series analyst. Your primary goal is to provide structured, accurate, and detailed information about movies, shows, and more.

You MUST always return your response as a single, valid JSON object that adheres to the provided schema below.

- For factual data like cast, crew, release year, trailer URL, ratings, and where-to-watch, you MUST use the Google Search grounding tool to ensure accuracy. Do not hallucinate.
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