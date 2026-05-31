# MovieMonk Development Guide

Welcome to the MovieMonk development guide! This document outlines local setup instructions, repository structure, common development workflows, and testing guidelines.

---

## 1. Prerequisites & Toolchain

Ensure your system has the following toolchain installed:
- **Node.js**: `22.x` (verified in `package.json` engines)
- **npm**: Standard package manager bundled with Node
- **Python**: `3.11+` (required for running the FastAPI backend proxy locally)
- **API Keys**: Access keys for TMDB, OMDB, and Groq (see environment reference below)

---

## 2. Local Environment Setup

### 2.1 Clone & Dependency Setup
Clone your fork of the repository and install the frontend dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/moviemonk-ai.git
cd moviemonk-ai
npm install
```

### 2.2 Configure Local Variables
Create a `.env.local` file in the project root:
```env
# Base URL for the FastAPI backend proxy (default local port)
VITE_API_BASE_URL=http://localhost:8000

# Metadata Providers
TMDB_API_KEY=your_tmdb_v3_api_key
TMDB_READ_TOKEN=your_tmdb_v4_read_token
OMDB_API_KEY=your_omdb_api_key

# AI Providers
GROQ_API_KEY=your_groq_api_key
MISTRAL_API_KEY=your_mistral_key_optional
OPENROUTER_API_KEY=your_openrouter_key_optional
PERPLEXITY_API_KEY=your_perplexity_key_optional
```

### 2.3 Starting Dev Servers

1. **Start the Backend Service**:
   ```bash
   cd server
   pip install -r requirements.txt
   cp .env.example .env
   # Configure TMDB_API_KEY and GROQ_API_KEY in server/.env
   python main.py
   ```
   *The backend listens on `http://localhost:8000` (or `http://localhost:7860` if using Hugging Face settings).*

2. **Start the Frontend Service**:
   ```bash
   # Return to the root directory
   npm run dev
   ```
   *Vite serves the UI at `http://localhost:3000` with hot-reloading.*

---

## 3. Project Directory Structure

- `components/` — UI components (Search Island, displays, carousels, layouts)
- `pages/` — Page shells (Discovery page, Search results, Settings panel)
- `services/` — AI adapters, TMDB fetches, caching layers, synchronization
- `styles/` — Global styling and modern CSS files
- `lib/` — Shared utilities (cache wrappers, Redis connections, SEO helpers)
- `server/` — Python FastAPI backend code
- `__tests__/` — Jest tests for components, services, and integration flows
- `types.ts` — Shared TypeScript interface definitions (e.g., `MovieData`)

---

## 4. Key Development Workflows

### 4.1 Modifying AI Prompts
- **Location**: [constants.ts](file:///home/mfscpayload-690/Desktop/moviemonk-ai/constants.ts) -> `INITIAL_PROMPT`
- **Rules**:
  - Always specify the exact schema formatting rules.
  - Sync prompt requirements with the schema in `MOVIE_DATA_SCHEMA`.
  - Check compatibility by performing searches in Simple and Complex modes.

### 4.2 Changing the Data Schema
To introduce a new property (e.g., `budget`):
1. **Define in types**: Add `budget: string` in [types.ts](file:///home/mfscpayload-690/Desktop/moviemonk-ai/types.ts).
2. **Update JSON Schema**: Document the field format in the `MOVIE_DATA_SCHEMA` object in `constants.ts`.
3. **Instruct LLM**: Add matching extraction logic to the `INITIAL_PROMPT` in `constants.ts`.
4. **Update Render UI**: Modify components (e.g., `components/MovieDisplay.tsx`) to display the new field.

### 4.3 Adding TMDB Features
- **Location**: [tmdbService.ts](file:///home/mfscpayload-690/Desktop/moviemonk-ai/services/tmdbService.ts)
- Add or modify endpoints from the TMDB v3 API. Ensure you normalize payloads into standard frontend interfaces to avoid UI layout breakages.

---

## 5. Debugging & Diagnostic Tools

### 5.1 Browser Developer Tools
- **Console Log Monitoring**: Check for AI fallback cascades, serialization warnings, or TMDB image path exceptions.
- **Network Inspections**: Track requests sent to backend API routes (`/api/*`). Verify status codes (e.g., `200 OK`, `429 Too Many Requests`).
- **React DevTools**: Inspect React hooks state, component props, and verify correct memoization.

### 5.2 Performance Profiling
- To debug rendering performance and identify long tasks, launch the dev server with performance debugging enabled:
  ```bash
  VITE_PERF_DEBUG=true npm run dev
  ```
- With this flag set, the console logs long tasks via the `PerformanceObserver` and outputs rendering statistics for heavy components.

---

## 6. Testing & Quality Assurance

All changes must pass automated and manual quality checks before merging.

### 6.1 Running Tests
- **Type Checking**:
  ```bash
  npm run lint
  ```
- **Jest Unit & Integration Tests**:
  ```bash
  npm test -- --runInBand
  ```
- **Production Build Check**:
  ```bash
  npm run build
  ```

### 6.2 Manual Verification Checklist
- [ ] Confirm search resolution functions correctly in both Simple and Complex modes.
- [ ] Verify image poster, backdrop, and cast galleries render without layout jank.
- [ ] Test viewport responsive designs (mobile bottom-sheet layouts and desktop centered viewports).
- [ ] Confirm watchlist and watchlist sync works, falling back to guest mode when database sync is disabled.

---

## 7. Git & Contribution Workflow

### 7.1 Branch Naming Conventions
- `feature/*` — New features (e.g., `feature/actor-biography`)
- `bugfix/*` — Bug fixes (e.g., `bugfix/image-fallback`)
- `docs/*` — Documentation changes

### 7.2 Commit Standards
Follow the [Conventional Commits](https://www.conventionalcommits.org/) standards. Avoid using emojis in commit messages:
- `feat: Add actor shortlist search`
- `fix: Resolve layout jank on Safari`
- `docs: Update API references`

### 7.3 Pull Request Template
Fill out the PR details in the `.github/pull_request_template.md` file. Always attach screenshots or screen recordings showing UI/UX modifications.

---

## 8. Resources Directory

- [React 19 Docs](https://react.dev/)
- [Vite Bundler Guide](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TMDB API Reference](https://developer.themoviedb.org/)
- [Groq status page](https://status.groq.com)
