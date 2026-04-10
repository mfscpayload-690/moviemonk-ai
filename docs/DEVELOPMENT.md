# Development Guide

How to work on MovieMonk locally with the current toolchain.

---

## Prerequisites
- Node.js 22.x (matches `package.json` engines)
- npm (installed with Node)
- Access to required API keys (see environment list below)

## Setup
1. Clone your fork and install dependencies:
   ```bash
   git clone https://github.com/mfscpayload-690/moviemonk-ai.git
   cd moviemonk-ai
   npm install
   ```
2. Create `.env.local` with the keys you need:
   ```env
   TMDB_API_KEY=...
   TMDB_READ_TOKEN=...
   OMDB_API_KEY=...
   GROQ_API_KEY=...
   MISTRAL_API_KEY=...
   OPENROUTER_API_KEY=...
   PERPLEXITY_API_KEY=...
   SERPAPI_KEY=...
   REDIS_URL=...        # optional for server cache
   ALLOWED_ORIGINS=...  # optional CORS allowlist
   APP_ORIGIN=...       # optional origin for CORS headers
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Vite serves the app at http://localhost:3000 with hot reload.

## Project layout
- `App-Responsive.tsx` — main UI shell that wires the search island and result views.
- `components/` — UI components (search island, displays, icons).
- `services/` — API integrations, AI provider orchestration, caching helpers.
- `api/` — Vercel-style serverless routes for TMDB/OMDB, AI providers, and search endpoints.
- `lib/` — shared utilities (e.g., Redis cache wrapper).
- `styles/` — global styles and component-specific CSS.
- `__tests__/` — Jest tests covering APIs and core services.

## Common workflows
- **Feature work**: create a branch, implement changes, `npm run dev` for manual verification, then `npm test -- --runInBand` and `npm run build`.
- **Bug fixes**: reproduce in dev, add or update tests alongside the fix, ensure `npm run lint` passes.
- **API changes**: update handlers under `api/`, keep observability/cors helpers intact, and refresh related docs in `docs/API.md`.

## Testing and quality
- Unit/integration tests: `npm test -- --runInBand`
- Type check: `npm run lint`
- Production build: `npm run build`

## Troubleshooting
- **Invalid API key**: confirm values in `.env.local` and ensure Vite picked up changes (restart dev server).
- **CORS issues**: set `ALLOWED_ORIGINS` or `APP_ORIGIN` when calling APIs from different origins.
- **Slow responses**: verify `REDIS_URL` is reachable if server caching is enabled; otherwise caching falls back to browser storage only.

## Contributing
See `../CONTRIBUTING.md` for branching, review, and PR expectations.

4. **Build** to ensure no errors:
   ```bash
   npm run build
   ```

5. **Commit** with descriptive message:
   ```bash
   git add .
   git commit -m "feat: Add [feature description]"
   ```

6. **Push** and create Pull Request:
   ```bash
   git push origin feature/my-new-feature
   ```

### Modifying AI Prompts

**Location**: `constants.ts` → `INITIAL_PROMPT`

**Guidelines:**
- Be explicit about expected output format
- Include examples for complex fields
- Update `MOVIE_DATA_SCHEMA` if adding/removing fields
- Sync changes with `types.ts`

**Testing prompts:**
```bash
npm run dev
# Try various queries: simple, complex, edge cases
# Check console logs for AI provider responses
# Verify all providers return consistent format
```

### Changing Data Schema

**Steps:**
1. Update `types.ts` → Add/modify interface
2. Update `constants.ts` → `MOVIE_DATA_SCHEMA`
3. Update `constants.ts` → `INITIAL_PROMPT` (describe new field)
4. Update UI → `MovieDisplay.tsx` to render new field
5. Test end-to-end

**Example** - Adding a `budget` field:

```typescript
// types.ts
export interface MovieData {
  // ...existing fields
  budget: string;
}

// constants.ts - MOVIE_DATA_SCHEMA
budget: { 
  type: Type.STRING, 
  description: "Production budget in USD (e.g., '$200 million')" 
}

// constants.ts - INITIAL_PROMPT
// Add instruction to fetch budget

// MovieDisplay.tsx
<p className="text-sm">
  <span className="font-semibold">Budget:</span> {movie.budget}
</p>
```

### Adding TMDB Features

**Location**: `services/tmdbService.ts`

**Available endpoints** (extend as needed):
- `/movie/{id}` - Movie details
- `/tv/{id}` - TV show details
- `/person/{id}` - Actor/director info
- `/discover/movie` - Browse movies
- `/trending/{media_type}/{time_window}` - Trending content

**Example** - Fetch similar movies:

```typescript
async function fetchSimilarMovies(mediaType: 'movie'|'tv', id: number): Promise<MovieData[]> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/similar`);
    return data.results.slice(0, 5).map(/* transform to MovieData */);
  } catch (e) {
    console.warn('Similar movies error:', e);
    return [];
  }
}
```

### Modifying AI Service Behavior

**Location**: `services/aiService.ts`, `services/groqService.ts`, `services/mistralService.ts`

**Provider fallback chain:**
1. Groq (primary)
2. Mistral (backup)
3. OpenRouter (fallback)

**Testing provider changes:**
```bash
npm run dev
# Try various queries in different complexity modes
# Check browser console for which provider was used
# Verify fallback works by temporarily disabling providers
```

---

## Debugging

### Browser DevTools

**Browser DevTools:**

**Console logs:**
- AI services log provider selection and errors
- TMDB service logs search/image errors
- Check for parsing failures
- Monitor which AI provider is being used

**Network tab:**
- Monitor API calls to `/api/*` endpoints
- Check request/response payloads
- Verify 200 status codes
- Watch for rate limiting errors

**React DevTools:**
- Install extension: [React DevTools](https://react.dev/learn/react-developer-tools)
- Inspect component state/props
- Profile performance

### Common Issues

**Issue: "API key not valid"**
- Check `.env.local` has correct key
- Restart dev server after env changes: `Ctrl+C` then `npm run dev`
- Verify no extra spaces or newlines in keys

**Issue: Images not loading**
- Verify TMDB credentials (prefer Read Access Token)
- Check console for 401 errors
- Ensure `enrichWithTMDB` is called in data flow

**Issue: JSON parsing fails**
- Log raw response in AI service files
- Check if AI returned unexpected format
- Verify schema matches `types.ts`

**Issue: Slow queries**
- Use Simple mode for testing
- Complex mode has longer processing time
- Check network throttling in DevTools
- Verify caching is working

**Issue: AI provider failures**
- Check provider status pages
- Verify all API keys are valid
- System should automatically fallback to next provider
- Check console logs for fallback messages

---

## Testing

**Manual testing checklist:**
- [ ] Search for a movie (e.g., "Inception")
- [ ] Toggle Simple vs Complex mode
- [ ] Verify all data fields populate
- [ ] Click spoiler sections
- [ ] Play trailer
- [ ] Check gallery images
- [ ] Test on mobile viewport
- [ ] Try edge cases (typos, non-existent titles)

**Future: Automated tests**
- Unit tests for services (Jest/Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)

---

## Build & Preview

```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

**Build output**: `dist/` directory

**Optimization:**
- Vite bundles and minifies
- Code splitting automatic
- Assets hashed for caching

---

## Environment Variables

**Development** (`.env.local`):
```env
# AI Providers
GROQ_API_KEY=your_key
MISTRAL_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# Movie Data APIs
TMDB_READ_TOKEN=your_token
TMDB_API_KEY=your_key
OMDB_API_KEY=your_key

# Optional
PERPLEXITY_API_KEY=your_key
```

**Production** (Vercel Environment Variables):
- Add same variables in Vercel dashboard
- Go to Project Settings → Environment Variables
- Keys are injected at runtime via serverless functions

**Accessing in code:**
```typescript
const apiKey = process.env.GROQ_API_KEY;
```

**Security note:** With the current architecture, API keys for AI providers are accessed via Vercel serverless functions (`/api/*`), keeping them secure and never exposed to the browser.

---

## Git Workflow

### Branching Strategy

- `main` - production-ready code
- `feature/*` - new features
- `fix/*` - bug fixes
- `docs/*` - documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add actor search functionality
fix: Resolve image loading issue
docs: Update API integration guide
style: Format code with Prettier
refactor: Simplify TMDB service
```

### Pull Requests

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Tested locally
- [ ] Build passes
- [ ] No console errors

## Screenshots (if UI changes)
[Attach screenshots]
```

---

## Code Quality

### Linting (Future)

**Recommended setup:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
```

**Run:**
```bash
npm run lint
npm run format
```

### Type Checking

```bash
npx tsc --noEmit
```

---

## Performance Tips

**Optimization strategies:**
- Lazy load images: `loading="lazy"`
- Debounce search input
- Cache TMDB responses (localStorage)
- Use React.memo for expensive components
- Code split routes (if adding navigation)

---

## Troubleshooting Dev Environment

**Node version issues:**
```bash
node -v  # Should be 22.x
nvm use 22  # If using nvm
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

---

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Mistral AI Docs](https://docs.mistral.ai)
- [OpenRouter Docs](https://openrouter.ai/docs)
- [TMDB API Docs](https://developer.themoviedb.org/docs)

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/mfscpayload-690/moviemonk-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mfscpayload-690/moviemonk-ai/discussions)
- **Email**: Check README for contact info

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow) for detailed workflow.
