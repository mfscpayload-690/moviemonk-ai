# Development Guide

Guide for local development, code conventions, and contributing to MovieMonk.

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/mfscpayload-690/moviemonk-ai.git
cd moviemonk-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
# GEMINI_API_KEY=...
# TMDB_READ_TOKEN=...
# TMDB_API_KEY=...
```

### Development Server

```bash
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000)

**Hot Module Replacement (HMR):**
- Edit files → browser auto-reloads
- State preserved during reload
- Fast feedback loop

---

## Project Structure Explained

```
moviemonk-ai/
├── .github/
│   ├── workflows/
│   │   └── deploy.yml              # CI/CD workflow
│   └── copilot-instructions.md     # AI assistant guidelines
├── asset/
│   └── MovieMonk Logo.png          # Project logo
├── components/
│   ├── ChatInterface.tsx           # User input & conversation
│   ├── MovieDisplay.tsx            # Result display & UI
│   ├── ErrorBanner.tsx             # Error notifications
│   └── icons.tsx                   # SVG icon components
├── services/
│   ├── geminiService.ts            # Gemini AI integration
│   └── tmdbService.ts              # TMDB API integration
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md (this file)
│   └── API.md
├── App.tsx                         # Main app component
├── constants.ts                    # Prompts & config
├── types.ts                        # TypeScript types
├── index.tsx                       # Entry point
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies
└── README.md                       # Project overview
```

---

## Code Conventions

### TypeScript

- **Strict mode enabled** in `tsconfig.json`
- Use explicit types (avoid `any`)
- Interfaces for data models (`types.ts`)
- Function return types required

**Example:**
```typescript
async function fetchMovieData(
  query: string,
  complexity: QueryComplexity,
  chatHistory?: ChatMessage[]
): Promise<FetchResult> {
  // Implementation
}
```

### React Components

- **Functional components** with hooks
- Props interface for each component
- Use `React.FC` type annotation

**Example:**
```typescript
interface ChatInterfaceProps {
  onSendMessage: (message: string, complexity: QueryComplexity) => void;
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isLoading }) => {
  // Component logic
};
```

### Naming Conventions

- **Components**: PascalCase (`MovieDisplay.tsx`)
- **Functions/variables**: camelCase (`fetchMovieData`)
- **Constants**: UPPER_SNAKE_CASE (`INITIAL_PROMPT`)
- **Types/Interfaces**: PascalCase (`MovieData`, `FetchResult`)
- **Files**: kebab-case or PascalCase matching component name

### Styling

- **Tailwind CSS** utility classes
- Custom colors defined in `index.html` (Tailwind config)
- Responsive design: mobile-first approach
- Dark theme default

**Color Palette:**
```javascript
'brand-bg': '#121212',
'brand-surface': '#1e1e1e',
'brand-primary': '#6a44ff',
'brand-secondary': '#a855f7',
'brand-accent': '#f472b6',
'brand-text-light': '#e5e7eb',
'brand-text-dark': '#9ca3af',
```

---

## Development Workflows

### Adding a New Feature

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Implement** the feature
   - Update types in `types.ts` if needed
   - Add/modify components
   - Update services if API changes needed

3. **Test locally**:
   ```bash
   npm run dev
   # Test in browser
   ```

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
# Check console logs for Gemini responses
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

---

## Debugging

### Browser DevTools

**Console logs:**
- Gemini service logs raw responses
- TMDB service logs search/image errors
- Check for parsing failures

**Network tab:**
- Monitor API calls
- Check request/response payloads
- Verify 200 status codes

**React DevTools:**
- Install extension: [React DevTools](https://react.dev/learn/react-developer-tools)
- Inspect component state/props
- Profile performance

### Common Issues

**Issue: "API key not valid"**
- Check `.env.local` has correct key
- Restart dev server after env changes: `Ctrl+C` then `npm run dev`

**Issue: Images not loading**
- Verify TMDB credentials
- Check console for 401 errors
- Ensure `enrichWithTMDB` is called

**Issue: JSON parsing fails**
- Log raw `response.text` in `geminiService.ts`
- Check if Gemini returned markdown fences
- Verify schema matches `types.ts`

**Issue: Slow queries**
- Use Simple mode for testing
- Complex mode has longer thinking time
- Check network throttling in DevTools

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
GEMINI_API_KEY=your_key
TMDB_READ_TOKEN=your_token
TMDB_API_KEY=your_key
```

**Production** (GitHub Secrets / Platform dashboards):
- Add same variables
- Injected at build time via `vite.config.ts`

**Accessing in code:**
```typescript
const apiKey = process.env.GEMINI_API_KEY;
```

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
node -v  # Should be 18+
nvm use 20  # If using nvm
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
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
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
