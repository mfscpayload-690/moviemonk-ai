# How MovieMonk Works

Simple overview of the app structure.

---

## Main Parts

### 1. User Interface
- `ChatInterface.tsx` - Where you type your search
- `MovieDisplay.tsx` - Shows the movie/show info
- `App.tsx` - Connects everything together

### 2. Data Services
- `aiService.ts` - Manages AI provider fallback chain (Groq → Mistral → OpenRouter)
- `groqService.ts` - Primary AI provider (fast and free)
- `mistralService.ts` - Backup AI provider
- `openrouterService.ts` - Fallback AI provider
- `tmdbService.ts` - Gets movie data from TMDB
- `cacheService.ts` - Stores results to speed things up
- `perplexityService.ts` - Web search for recent releases (optional)

### 3. Data Flow

```
You search "Inception"
         ↓
App checks cache
         ↓
If not cached:
    → Call TMDB for movie data
    → Call AI (Groq → Mistral → OpenRouter fallback)
    → Merge the data
    → Save to cache
         ↓
Show results on screen
```

---

## How AI Works

1. You ask about a movie
2. We find it in TMDB database
3. AI (Groq/Mistral/OpenRouter) writes summaries and trivia
4. We combine TMDB facts + AI creativity
5. You see the complete result

---

## Why This Design?

- **TMDB First**: Always accurate cast, crew, ratings
- **AI Enhancement**: Creative summaries and trivia from multiple providers
- **Caching**: Makes repeat searches instant
- **Multiple AI Providers**: Automatic fallback if one fails (Groq → Mistral → OpenRouter)
- **Perplexity Integration**: Web search for recent or obscure titles

---

That's it! Simple and straightforward.
