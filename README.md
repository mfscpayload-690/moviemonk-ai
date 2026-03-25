# MovieMonk 🎬

AI-assisted movie and series search that blends verified metadata with LLM summaries and a fast, search-first UI.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What this project does
MovieMonk lets you search movies and people with a dynamic “search island,” resolves ambiguous titles, and returns fact-checked details enriched with AI-written context.

## Key features
- Verified metadata from TMDB/OMDB with automatic fallbacks for hard-to-find titles.
- Multi-provider AI summaries with Groq → Mistral → OpenRouter fallback.
- Dynamic search island with keyboard shortcuts, quick/complex modes, and suggestion dropdowns.
- Disambiguation flow for ambiguous titles and people with selectable candidates.
- Multi-layer caching (localStorage, IndexedDB, optional Redis) to keep repeat searches fast.
- Responsive layout optimized for desktop and mobile.

## Screenshots
[Screenshot Placeholder: Home/Search Experience]  
[Screenshot Placeholder: Suggestion Dropdown]  
[Screenshot Placeholder: Movie Details View]  
[Screenshot Placeholder: Mobile Header/Search]

## Search behavior and UX flow
- Open the floating search island (click or `/`/`K`), pick quick vs. complex analysis, and choose a provider when needed.
- Type a query to see suggestions; select a candidate or submit to fetch details.
- Results show enriched movie/person data with AI-generated notes, related sources, and cached responses on repeat searches.
- Mobile view keeps the search control reachable near the bottom with safe-area spacing.

## Architecture overview
- React + TypeScript (Vite) front end.
- Serverless API routes under `api/` for TMDB, OMDB, AI providers, and suggestion/query endpoints.
- AI provider orchestration with observability and automatic fallback (Groq, Mistral, OpenRouter, optional Perplexity).
- Data fetching and disambiguation via TMDB plus hybrid web search helpers; caching via browser storage and optional Redis (`REDIS_URL`).
- See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API.md](docs/API.md) for diagrams and endpoint details.

## Configuration and environment variables
Create `.env.local` with the keys you use:
```
TMDB_API_KEY=...
TMDB_READ_TOKEN=...         # preferred for TMDB requests
OMDB_API_KEY=...
GROQ_API_KEY=...            # AI primary
MISTRAL_API_KEY=...         # AI backup
OPENROUTER_API_KEY=...      # AI fallback
PERPLEXITY_API_KEY=...      # optional web search assist
SERPAPI_KEY=...             # optional suggestion/search enrichment
REDIS_URL=...               # optional server cache
ALLOWED_ORIGINS=...         # optional CORS allowlist
APP_ORIGIN=...              # optional CORS/site origin
```

## Local run (from an existing clone)
1) Install dependencies: `npm install`  
2) Start dev server: `npm run dev` (Vite defaults to http://localhost:3000)  
3) Build for production: `npm run build` (outputs to `dist/`)

## Testing and quality checks
- Run tests: `npm test -- --runInBand`
- Type check: `npm run lint`
- Production build check: `npm run build`

## Deployment overview
- Deploy on Vercel or another Node hosting platform using `npm run build` output; see docs/DEPLOYMENT.md for platform steps and env setup.

## Documentation index
- docs/ARCHITECTURE.md — structure and data flow
- docs/API.md — provider and API integration notes
- docs/DEVELOPMENT.md — local workflows and project structure
- docs/CACHING.md — caching layers and configuration
- docs/DEPLOYMENT.md — deployment options
- docs/DYNAMIC_SEARCH_ISLAND.md — search island behavior
- api/README.md — serverless proxy usage
- CONTRIBUTING.md — contribution process
- SECURITY.md — vulnerability reporting
- LICENSE — project license
