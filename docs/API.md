# API Guide

How MovieMonk uses AI and movie data APIs.

---

## AI Providers

We use free AI APIs to generate summaries:

- **Groq** (primary) - Fast and free
- **Mistral** (backup) - Also free
- **OpenRouter** (fallback) - Last resort

### Getting API Keys

1. **Groq**: Sign up at [console.groq.com](https://console.groq.com)
2. **TMDB**: Get key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
3. **OMDB**: Get key at [omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

### Query Modes

- **Simple Mode**: Quick responses, basic AI model
- **Complex Mode**: Detailed analysis, smarter AI model

---

## TMDB API

We use TMDB for accurate movie data (cast, crew, images, ratings).

### Authentication

Add these to your `.env.local`:

```env
TMDB_API_KEY=your_key_here
TMDB_READ_TOKEN=your_token_here
```

### What We Get From TMDB

- Movie/show posters and backdrops
- Cast and crew info
- IMDB ratings (via external ID)
- Gallery images
- Streaming availability

### Image URLs

TMDB provides images like this:
```
https://image.tmdb.org/t/p/w500/path-to-image.jpg
```

Sizes: `w300`, `w500`, `w780`, `original`

---

## How It All Works Together

1. **You search** for a movie
2. **TMDB finds** the movie data
3. **AI writes** summaries and trivia
4. **We merge** TMDB facts + AI creativity
5. **You see** the complete result

---

## Error Handling

Common issues and fixes:

**"Invalid API key"**
- Check your `.env.local` file
- Make sure keys are correct

**"Too many requests"**
- Wait a moment and try again
- We cache results to avoid this

**"No results found"**
- Try different search terms
- Check spelling
- Try just the movie title without year

---

## Rate Limits

- **Groq**: 15 requests/minute (free tier)
- **TMDB**: 40 requests/10 seconds
- **OMDB**: 1000 requests/day

We cache responses to stay within limits.

---

## Need Help?

Check the main [README](../README.md) or open an issue on GitHub.

---

## Table of Contents

- [Gemini AI API](#gemini-ai-api)
  - [Authentication](#authentication)
  - [Model Selection](#model-selection)
  - [Prompt Engineering](#prompt-engineering)
  - [Response Handling](#response-handling)
  - [Error Handling](#error-handling)
  - [Example Requests](#example-requests)
- [TMDB API](#tmdb-api)
  - [Authentication](#authentication-1)
  - [Endpoints](#endpoints)
  - [Image URLs](#image-urls)
  - [Search & Enrichment](#search--enrichment)
  - [Error Handling](#error-handling-1)
  - [Example Requests](#example-requests-1)
- [Integration Patterns](#integration-patterns)
- [Rate Limits & Best Practices](#rate-limits--best-practices)

---

## Gemini AI API

### Authentication

**API Key Setup:**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

**Get your key:**
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create new API key
- Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

---

### Model Selection

MovieMonk uses two models based on query complexity:

| Mode | Model | Use Case | Thinking Budget |
|------|-------|----------|----------------|
| **Simple** | `gemini-2.5-flash` | Fast, straightforward queries | None |
| **Complex** | `gemini-2.5-pro` | Detailed analysis, plot summaries | 10,000 tokens |

**Implementation:**

```typescript
export enum QueryComplexity {
  SIMPLE = 'simple',
  COMPLEX = 'complex'
}

function getModel(complexity: QueryComplexity) {
  if (complexity === QueryComplexity.COMPLEX) {
    return genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        responseModality: "TEXT",
        responseMimeType: "application/json",
        responseSchema: MOVIE_DATA_SCHEMA,
        thinkingConfig: { thinkingBudget: 10000 }
      }
    });
  } else {
    return genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseModality: "TEXT",
        responseMimeType: "application/json",
        responseSchema: MOVIE_DATA_SCHEMA
      }
    });
  }
}
```

---

### Prompt Engineering

**System Instruction:**

Located in `constants.ts` → `INITIAL_PROMPT`. This is the "constitution" for the AI:

```typescript
export const INITIAL_PROMPT = `You are a movie and TV series expert assistant. Always return STRICTLY a single, valid JSON object conforming exactly to the schema provided.

CRITICAL RULES:
1. Always return a SINGLE JSON object (not an array, not multiple objects).
2. If a field cannot be verified, use "" for strings or [] for arrays (do NOT omit the field).
3. Use the Google Search tool to find the most accurate, up-to-date information.
4. Verify all facts before including them in your response.
...
`;
```

**Key Sections:**
- **Role definition**: Movie/TV expert
- **Output format**: JSON only, schema compliance
- **Tool usage**: Google Search for grounding
- **Field handling**: Empty vs null rules
- **Examples**: Show expected structure

**Modification tips:**
- Be explicit about edge cases
- Provide examples for complex fields
- Mention tools by name if you want them used
- Test with edge cases after changes

---

### Response Handling

**1. Basic Response:**

```typescript
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: query }] }],
  tools: [{ googleSearch: {} }]
});

const response = result.response;
const text = response.text();
```

**2. Response Object Structure:**

```typescript
{
  candidates: [{
    content: { parts: [{ text: "JSON string" }] },
    finishReason: "STOP" | "SAFETY" | "MAX_TOKENS" | ...,
    groundingMetadata: {
      groundingChunks: [{ web: { uri: "...", title: "..." } }],
      webSearchQueries: ["query1", "query2"]
    }
  }]
}
```

**3. Parsing JSON:**

MovieMonk strips markdown fences before parsing:

```typescript
function parseJsonResponse(text: string): MovieData {
  // Remove markdown code fences
  const cleanedText = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const parsed = JSON.parse(cleanedText);
  return parsed as MovieData;
}
```

**4. Grounding Sources:**

Extract web sources from `groundingMetadata`:

```typescript
const sources: DataSource[] = 
  response.candidates[0].groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web.title,
      url: chunk.web.uri
    })) || [];
```

---

### Error Handling

**Common Error Scenarios:**

1. **Invalid API Key:**
   ```typescript
   catch (error) {
     if (error.message.includes('API_KEY_INVALID')) {
       throw new Error('Invalid Gemini API key. Check your .env.local');
     }
   }
   ```

2. **Safety Filters:**
   ```typescript
   if (response.candidates[0].finishReason === 'SAFETY') {
     throw new Error('Content filtered by safety settings');
   }
   ```

3. **Token Limit:**
   ```typescript
   if (response.candidates[0].finishReason === 'MAX_TOKENS') {
     console.warn('Response truncated - increase token limit');
   }
   ```

4. **JSON Parsing:**
   ```typescript
   try {
     return JSON.parse(cleanedText);
   } catch (e) {
     console.error('JSON parse failed. Raw response:', text);
     throw new Error('Invalid JSON from Gemini');
   }
   ```

---

### Example Requests

**Simple Query (Flash model):**

```typescript
const query = "Tell me about Inception (2010)";
const complexity = QueryComplexity.SIMPLE;

const result = await fetchMovieData(query, complexity);
// Returns MovieData with basic fields filled
```

**Complex Query (Pro model with thinking):**

```typescript
const query = "Give me a detailed plot breakdown of Interstellar with scientific accuracy notes";
const complexity = QueryComplexity.COMPLEX;

const result = await fetchMovieData(query, complexity);
// Returns MovieData with extensive plot analysis
```

**With Chat History:**

```typescript
const chatHistory: ChatMessage[] = [
  { role: 'user', content: 'Find action movies from 2023' },
  { role: 'assistant', content: 'Here are some...' }
];

const query = "Which one has the best reviews?";
const result = await fetchMovieData(query, QueryComplexity.SIMPLE, chatHistory);
// Uses conversation context for relevance
```

---

## TMDB API

### Authentication

**Two authentication methods:**

1. **API Key (v3):**
   ```typescript
   const params = new URLSearchParams({
     api_key: process.env.TMDB_API_KEY!
   });
   ```

2. **Read Access Token (v4 - Recommended):**
   ```typescript
   const headers = {
     Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
     'Content-Type': 'application/json'
   };
   ```

**Get credentials:**
- [Sign up at TMDB](https://www.themoviedb.org/signup)
- Go to Settings → API
- Copy **API Key (v3 auth)** and **Read Access Token (v4 auth)**

**Add to `.env.local`:**
```env
TMDB_API_KEY=your_v3_key
TMDB_READ_TOKEN=your_v4_token
```

---

### Endpoints

**Base URL:**
```typescript
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
```

**Key endpoints used in MovieMonk:**

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/search/movie` | Search movies | `query`, `year` (optional) |
| `/search/tv` | Search TV shows | `query`, `first_air_date_year` (optional) |
| `/search/multi` | Search all media | `query` |
| `/movie/{id}` | Movie details | Movie ID |
| `/tv/{id}` | TV show details | Show ID |
| `/movie/{id}/images` | Movie images | Movie ID |
| `/tv/{id}/images` | TV show images | Show ID |

**Example implementations:**

```typescript
async function tmdbFetch(endpoint: string, params?: URLSearchParams) {
  const url = `${TMDB_BASE_URL}${endpoint}?${params || ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

---

### Image URLs

**TMDB Image CDN:**
```
https://image.tmdb.org/t/p/{size}{file_path}
```

**Available sizes:**

| Type | Sizes |
|------|-------|
| Poster | `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original` |
| Backdrop | `w300`, `w780`, `w1280`, `original` |
| Logo | `w45`, `w92`, `w154`, `w185`, `w300`, `w500`, `original` |

**Implementation:**

```typescript
function buildImageUrl(path: string, size: string = 'w500'): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// Usage
const posterUrl = buildImageUrl(movie.poster_path, 'w500');
const backdropUrl = buildImageUrl(movie.backdrop_path, 'original');
```

**Responsive sizes in MovieMonk:**
- Posters: `w500` (default), `w780` (high-res)
- Backdrops: `original` (hero image), `w1280` (gallery)
- Gallery: `w780` for balance between quality and load time

---

### Search & Enrichment

**Search Strategy:**

MovieMonk uses a multi-step search:

1. **Extract title and year** from query
2. **Try movie search** with year filter
3. **Try TV search** if no movie found
4. **Fallback to multi-search** without year
5. **Return first result** (best match)

**Implementation:**

```typescript
async function searchMovieOrShow(title: string, year?: number) {
  // Try movie with year
  if (year) {
    const movieResults = await tmdbFetch('/search/movie', 
      new URLSearchParams({ query: title, year: year.toString() })
    );
    if (movieResults.results?.length > 0) {
      return { 
        result: movieResults.results[0], 
        mediaType: 'movie' as const 
      };
    }
  }

  // Try movie without year
  const movieResults = await tmdbFetch('/search/movie',
    new URLSearchParams({ query: title })
  );
  if (movieResults.results?.length > 0) {
    return { 
      result: movieResults.results[0], 
      mediaType: 'movie' as const 
    };
  }

  // Try TV
  const tvResults = await tmdbFetch('/search/tv',
    new URLSearchParams({ query: title })
  );
  if (tvResults.results?.length > 0) {
    return { 
      result: tvResults.results[0], 
      mediaType: 'tv' as const 
    };
  }

  return null;
}
```

**Image Enrichment:**

Always prefer TMDB images over AI-provided URLs:

```typescript
async function enrichWithTMDB(data: MovieData): Promise<MovieData> {
  const { result, mediaType } = await searchMovieOrShow(data.title, data.year);

  if (!result) return data;

  const imagesData = await tmdbFetch(`/${mediaType}/${result.id}/images`);

  return {
    ...data,
    poster_url: buildImageUrl(result.poster_path) || data.poster_url,
    backdrop_url: buildImageUrl(result.backdrop_path) || data.backdrop_url,
    gallery_images: [
      ...imagesData.backdrops.slice(0, 4).map(img => buildImageUrl(img.file_path, 'w780')),
      ...imagesData.posters.slice(0, 2).map(img => buildImageUrl(img.file_path, 'w780'))
    ].slice(0, 6)
  };
}
```

---

### Error Handling

**1. Network Errors:**
```typescript
try {
  const data = await tmdbFetch('/search/movie', params);
} catch (error) {
  console.warn('TMDB fetch failed:', error);
  return null; // Graceful fallback
}
```

**2. Invalid Credentials:**
```typescript
if (response.status === 401) {
  throw new Error('Invalid TMDB credentials. Check .env.local');
}
```

**3. Rate Limiting:**
```typescript
if (response.status === 429) {
  console.warn('TMDB rate limit hit. Retrying in 1s...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Retry logic
}
```

**4. Missing Images:**
```typescript
function isValidImagePath(path: string | null): boolean {
  return path !== null && path !== undefined && path.startsWith('/');
}

const posterUrl = isValidImagePath(result.poster_path)
  ? buildImageUrl(result.poster_path)
  : 'fallback.png';
```

---

### Example Requests

**Search for a movie:**

```bash
curl -X GET "https://api.themoviedb.org/3/search/movie?query=Inception&year=2010" \
  -H "Authorization: Bearer YOUR_READ_TOKEN"
```

**Response:**
```json
{
  "results": [{
    "id": 27205,
    "title": "Inception",
    "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    "release_date": "2010-07-16",
    "vote_average": 8.369
  }]
}
```

**Fetch movie images:**

```bash
curl -X GET "https://api.themoviedb.org/3/movie/27205/images" \
  -H "Authorization: Bearer YOUR_READ_TOKEN"
```

**Response:**
```json
{
  "backdrops": [
    { "file_path": "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", "width": 1920, "height": 1080 }
  ],
  "posters": [
    { "file_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", "width": 2000, "height": 3000 }
  ]
}
```

---

## Integration Patterns

### Gemini + TMDB Flow

**1. User sends query** → ChatInterface
**2. Gemini processes** → Returns MovieData (text fields filled)
**3. TMDB enriches** → Adds reliable images
**4. Display result** → MovieDisplay renders

**Code flow:**

```typescript
async function fetchMovieData(query: string, complexity: QueryComplexity) {
  // Step 1: Get data from Gemini
  const geminiResult = await model.generateContent({...});
  const movieData = parseJsonResponse(geminiResult.response.text());

  // Step 2: Enrich with TMDB images
  const enrichedData = await enrichWithTMDB(movieData);

  // Step 3: Return complete data
  return {
    data: enrichedData,
    sources: extractSources(geminiResult.response)
  };
}
```

### When to Use Which API

| Data Type | Source | Reason |
|-----------|--------|--------|
| Plot, themes, trivia | **Gemini** | Natural language understanding, context |
| Images (poster, backdrop) | **TMDB** | Reliable, high-quality, consistent URLs |
| Ratings | **Gemini** | Aggregates from multiple sources |
| Where to watch | **Gemini** | Real-time Google Search grounding |
| Cast | **Gemini or TMDB** | Both work; Gemini for character names |
| Gallery | **TMDB** | Bulk high-res images |

---

## Rate Limits & Best Practices

### Gemini API

**Limits:**
- Free tier: 15 requests/minute, 1,500/day
- Paid: Higher limits based on plan

**Best practices:**
- Cache responses for repeat queries
- Use Simple mode when possible (faster, cheaper)
- Implement exponential backoff for retries
- Monitor usage in [AI Studio](https://aistudio.google.com/)

**Optimization:**
```typescript
// Debounce search input
const debouncedSearch = debounce((query: string) => {
  fetchMovieData(query, complexity);
}, 500);
```

### TMDB API

**Limits:**
- ~40 requests per 10 seconds
- No daily cap

**Best practices:**
- Cache search results (localStorage)
- Batch image requests
- Use appropriate image sizes (not always `original`)
- Prefer v4 auth (Read Access Token)

**Caching example:**
```typescript
const cacheKey = `tmdb_movie_${title}_${year}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const result = await searchMovieOrShow(title, year);
localStorage.setItem(cacheKey, JSON.stringify(result));
```

---

## Security Notes

**Environment Variables:**
- Never commit `.env.local` to Git
- Use GitHub Secrets for deployment
- Rotate keys if exposed

**API Key Exposure:**
- Client-side apps expose keys (expected)
- Consider backend proxy for production
- Monitor usage for abuse

**CORS:**
- TMDB allows cross-origin requests
- Gemini SDK handles CORS internally

---

## Future Enhancements

**Potential additions:**
- Backend proxy for API keys
- Redis caching layer
- GraphQL wrapper over both APIs
- Webhook for TMDB updates
- Batch Gemini requests for lists

---

## Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [TMDB API Docs](https://developer.themoviedb.org/docs)
- [TMDB API Reference](https://developer.themoviedb.org/reference/intro/getting-started)
- [Google AI Studio](https://aistudio.google.com/)

---

## Troubleshooting

**Issue: Gemini returns empty response**
- Check `finishReason` in logs
- Verify API key is valid
- Ensure prompt isn't triggering safety filters

**Issue: TMDB images not loading**
- Verify Read Access Token (not API Key)
- Check image URL format: `https://image.tmdb.org/t/p/w500/path.jpg`
- Ensure file_path starts with `/`

**Issue: Parsing errors**
- Log raw response text
- Check for markdown fences
- Validate JSON schema in constants.ts matches types.ts

**Issue: Slow responses**
- Use Simple mode (Flash model)
- Reduce thinking budget
- Check network throttling in DevTools
