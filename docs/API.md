# API Guide

How MovieMonk uses AI and movie data APIs.

---

## AI Providers

We use free AI APIs to generate summaries:

- **Groq** (primary) - Fast and free, uses llama-3.3-70b-versatile model
- **Mistral** (backup) - Also free, uses mistral-large-latest model
- **OpenRouter** (fallback) - Last resort for when other providers are unavailable

### Getting API Keys

1. **Groq**: Sign up at [console.groq.com](https://console.groq.com)
2. **Mistral**: Sign up at [console.mistral.ai](https://console.mistral.ai)
3. **OpenRouter**: Sign up at [openrouter.ai/keys](https://openrouter.ai/keys)
4. **TMDB**: Get key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
5. **OMDB**: Get key at [omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

### Query Modes

- **Simple Mode**: Quick responses, faster AI processing
- **Complex Mode**: Detailed analysis with extended thinking time

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
- IMDB ratings (via OMDB integration)
- Gallery images
- Streaming availability
- Release dates and runtime

### Image URLs

TMDB provides images like this:
```
https://image.tmdb.org/t/p/w500/path-to-image.jpg
```

Sizes: `w300`, `w500`, `w780`, `original`

---

## How It All Works Together

1. **You search** for a movie
2. **TMDB finds** the movie data (cast, ratings, images)
3. **AI writes** summaries and trivia using Groq/Mistral/OpenRouter
4. **We merge** TMDB facts + AI-generated content
5. **You see** the complete result with accurate data and engaging summaries

---

## Error Handling

Common issues and fixes:

**"Invalid API key"**
- Check your `.env.local` file
- Make sure keys are correct
- Verify you've set all required keys (Groq, TMDB, OMDB)

**"Too many requests"**
- Wait a moment and try again
- We cache results to avoid this
- System automatically falls back to alternate AI providers

**"No results found"**
- Try different search terms
- Check spelling
- Try just the movie title without year
- For recent releases, ensure Perplexity API key is configured

---

## Rate Limits

- **Groq**: 30 requests/minute (free tier), unlimited daily
- **Mistral**: 2M tokens/month (free tier)
- **OpenRouter**: Varies by model, used as fallback
- **TMDB**: 40 requests/10 seconds
- **OMDB**: 1000 requests/day (free tier)

We cache responses to stay within limits and improve performance.

---

## Need Help?

Check the main [README](../README.md) or open an issue on GitHub.

---

## AI Service Architecture

MovieMonk uses a robust multi-provider AI architecture with automatic fallback:

### Provider Priority

1. **Groq (Primary)** - `groqService.ts`
   - Model: `llama-3.3-70b-versatile`
   - Fast inference, free tier with generous limits
   - 30 requests/minute

2. **Mistral (Backup)** - `mistralService.ts`
   - Model: `mistral-large-latest`
   - 2M tokens/month free tier
   - Activated when Groq is unavailable

3. **OpenRouter (Fallback)** - `openrouterService.ts`
   - Multiple models available
   - Used as last resort
   - Proxied through Vercel serverless function

### How AI Integration Works

**1. Query Processing:**
```typescript
// User query is sent to AI service with complexity mode
const result = await aiService.fetchMovieData(query, complexity);
```

**2. AI Provider Selection:**
```typescript
// Services/aiService.ts automatically tries providers in order:
try {
  return await groqService.fetchMovieData(query, complexity);
} catch (error) {
  try {
    return await mistralService.fetchMovieData(query, complexity);
  } catch (error) {
    return await openrouterService.fetchMovieData(query, complexity);
  }
}
```

**3. Response Format:**
All AI providers return structured JSON with movie data:
```typescript
{
  title: string;
  year: number;
  plot: string;
  genres: string[];
  cast: Array<{name: string, character: string}>;
  // ... additional fields
}
```

---

## Authentication & Setup

### Required Environment Variables

```env
# AI Providers
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
OPENROUTER_API_KEY=your_openrouter_key

# Movie Data
TMDB_API_KEY=your_tmdb_key
TMDB_READ_TOKEN=your_tmdb_token
OMDB_API_KEY=your_omdb_key

# Optional
PERPLEXITY_API_KEY=your_perplexity_key
```

### Getting API Keys

- **Groq**: [console.groq.com](https://console.groq.com)
- **Mistral**: [console.mistral.ai](https://console.mistral.ai)
- **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys)
- **TMDB**: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **OMDB**: [omdbapi.com/apikey.aspx](http://www.omdbapi.com/apikey.aspx)

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

### AI + TMDB Data Flow

**Complete request flow:**

1. **User sends query** → ChatInterface component
2. **AI service processes** → Tries Groq → Falls back to Mistral → Falls back to OpenRouter
3. **TMDB enrichment** → Adds accurate images, cast, ratings
4. **OMDB integration** → Fetches IMDB ratings
5. **Cache storage** → Saves to localStorage and IndexedDB
6. **Display result** → MovieDisplay renders complete data

**Implementation example:**

```typescript
async function fetchMovieData(query: string, complexity: QueryComplexity) {
  // Step 1: Check cache first
  const cached = await cacheService.get(query);
  if (cached) return cached;

  // Step 2: Get AI-generated content (with fallback)
  const aiResult = await aiService.fetchMovieData(query, complexity);
  
  // Step 3: Enrich with TMDB data
  const enrichedData = await tmdbService.enrichWithTMDB(aiResult.data);
  
  // Step 4: Add IMDB ratings via OMDB
  const withRatings = await omdbService.addRatings(enrichedData);
  
  // Step 5: Cache the result
  await cacheService.set(query, withRatings);
  
  return withRatings;
}
```

### When to Use Which Service

| Data Type | Primary Source | Fallback | Reason |
|-----------|---------------|----------|--------|
| Plot, themes, trivia | **Groq/Mistral** | OpenRouter | Fast, free, natural language |
| Images (poster, backdrop) | **TMDB** | AI placeholder | Reliable, high-quality URLs |
| IMDB ratings | **OMDB** | None | Official IMDB data |
| Cast & crew | **TMDB** | AI data | 100% accurate from database |
| Where to watch | **AI providers** | Perplexity | Real-time info |
| Gallery images | **TMDB** | None | High-resolution gallery |

---

## Rate Limits & Best Practices

### AI Provider Limits

**Groq:**
- **Limits**: 30 requests/minute, unlimited daily (free tier)
- **Best practices**:
  - Primary provider due to speed and generous limits
  - Cache responses aggressively
  - Use for both simple and complex queries

**Mistral:**
- **Limits**: 2M tokens/month (free tier)
- **Best practices**:
  - Backup provider when Groq unavailable
  - Monitor token usage
  - Good for detailed responses

**OpenRouter:**
- **Limits**: Varies by model, pay-per-use
- **Best practices**:
  - Use only as last resort
  - Consider cost implications
  - Proxied through Vercel serverless function for security

### TMDB API

**Limits:**
- ~40 requests per 10 seconds
- No daily cap

**Best practices:**
- Cache search results (localStorage + IndexedDB)
- Batch image requests
- Use appropriate image sizes (not always `original`)
- Prefer v4 Read Access Token over v3 API key

**Caching example:**
```typescript
const cacheKey = `tmdb_movie_${title}_${year}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

const result = await searchMovieOrShow(title, year);
localStorage.setItem(cacheKey, JSON.stringify(result), { 
  expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
});
```

### Optimization Strategies

**Client-side optimizations:**
```typescript
// Debounce search input
const debouncedSearch = debounce((query: string) => {
  fetchMovieData(query, complexity);
}, 500);

// Lazy load images
<img loading="lazy" src={posterUrl} />

// Use React.memo for expensive components
const MovieCard = React.memo(({ movie }) => {
  // Expensive rendering logic
});
```

---

## Security & Best Practices

### API Key Protection

**Environment Variables:**
- Never commit `.env.local` to Git (already in `.gitignore`)
- Use GitHub Secrets or Vercel Environment Variables for deployment
- Rotate keys immediately if exposed

**Vercel Serverless Functions:**
- All API keys stored server-side only
- OpenRouter API proxied through `/api/openrouter` to hide key
- Keys never exposed to client-side code
- CORS protection on serverless endpoints

**Key Security Checklist:**
```bash
# ✅ Good: Server-side environment variables
GROQ_API_KEY=sk-...
MISTRAL_API_KEY=...

# ❌ Bad: Client-side exposed variables (don't use VITE_ prefix for keys)
# VITE_GROQ_API_KEY=sk-...
```

**Monitoring:**
- Monitor API usage in provider dashboards
- Set up usage alerts
- Review logs for unusual patterns
- Implement rate limiting on your endpoints

---

## TMDB API Reference

### Endpoints Used

**Base URL:** `https://api.themoviedb.org/3`

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/search/movie` | Search movies | `query`, `year` (optional) |
| `/search/tv` | Search TV shows | `query`, `first_air_date_year` (optional) |
| `/search/multi` | Search all media | `query` |
| `/movie/{id}` | Movie details | Movie ID |
| `/tv/{id}` | TV show details | Show ID |
| `/movie/{id}/images` | Movie images | Movie ID |
| `/tv/{id}/images` | TV show images | Show ID |
| `/movie/{id}/external_ids` | Get external IDs (IMDB) | Movie ID |

### Image URLs

**Format:** `https://image.tmdb.org/t/p/{size}{file_path}`

**Available sizes:**
- **Poster**: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
- **Backdrop**: `w300`, `w780`, `w1280`, `original`
- **Logo**: `w45`, `w92`, `w154`, `w185`, `w300`, `w500`, `original`

**Implementation:**
```typescript
function buildImageUrl(path: string, size: string = 'w500'): string {
  if (!path || !path.startsWith('/')) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
```

---

## Troubleshooting

### AI Service Issues

**Issue: "API key not valid" or "Unauthorized"**
- Verify API keys in `.env.local`
- Check for extra spaces or newlines in keys
- Restart dev server after updating environment variables
- For Vercel deployment, check environment variables in dashboard

**Issue: All AI providers failing**
- Check API key validity for all providers
- Verify internet connectivity
- Check provider status pages:
  - Groq: [status.groq.com](https://status.groq.com)
  - Mistral: [status.mistral.ai](https://status.mistral.ai)
  - OpenRouter: [status.openrouter.ai](https://status.openrouter.ai)

**Issue: Slow responses**
- Use Simple mode for faster processing
- Check network throttling in DevTools
- Verify caching is working (check localStorage)
- Consider proximity to provider servers

### TMDB Issues

**Issue: Images not loading**
- Verify TMDB credentials (prefer Read Access Token)
- Check console for 401/404 errors
- Ensure `enrichWithTMDB` is being called
- Validate image URLs start with `https://image.tmdb.org/`

**Issue: Search returns no results**
- Try without year filter
- Check for typos in title
- Use multi-search endpoint as fallback
- Verify movie exists in TMDB database

### General Debugging

**Browser Console:**
- Check for error messages
- Look for failed network requests (F12 → Network tab)
- Verify API responses are valid JSON

**Service Logs:**
- AI services log errors to console
- TMDB service warns on image fetch failures
- Cache service logs hits/misses in development

---

## Resources & Documentation

### AI Providers
- [Groq Documentation](https://console.groq.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai)
- [OpenRouter API Docs](https://openrouter.ai/docs)

### Movie Data APIs
- [TMDB API Documentation](https://developer.themoviedb.org/docs)
- [TMDB API Reference](https://developer.themoviedb.org/reference/intro/getting-started)
- [OMDB API Documentation](http://www.omdbapi.com/)

### Development Tools
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Deployment
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)

---

## Future Enhancements

**Potential additions:**
- WebSocket support for real-time updates
- GraphQL API wrapper
- Additional AI providers (Anthropic Claude, etc.)
- Redis caching layer for production
- Webhook integration for TMDB updates
- Batch processing for multiple queries
- User authentication and personalization
- Recommendation engine based on viewing history

---
