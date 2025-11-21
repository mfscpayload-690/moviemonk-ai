# MovieMonk 🎬

**100% Accurate** AI-powered movie and series search engine with **TMDB & IMDB factual data**, AI-enhanced plot summaries, cast info, spoiler-safe explanations, and real-time "where to watch" links.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![MovieMonk Banner](asset/MovieMonk%20Logo.png)

---

## ✨ Features

### 🎯 **Hybrid Accuracy Architecture**
- **TMDB First**: 100% accurate factual data (cast, crew, ratings, release dates) from The Movie Database
- **IMDB Ratings**: Real IMDB scores via OMDB API integration
- **Web Search Fallback**: Perplexity AI for recent releases not yet in TMDB
- **AI Enhancement**: Creative summaries, trivia, and spoiler breakdowns from Groq/Mistral/OpenRouter

### 🤖 **Smart Query Processing**
- Auto-detects season/episode numbers ("You season 5" → Season 5 of "You")
- Extracts years automatically ("Interstellar 2014")
- Intelligent complexity detection (recent releases use complex models)
- Multi-turn conversation support

### 📊 **Comprehensive Information**
- Cast & Crew (verified from TMDB)
- IMDB & Rotten Tomatoes ratings (real-time)
- Genres, release dates, runtime
- Official trailers, posters, backdrops, gallery
- Streaming availability (subscription/rent/buy)

### 📖 **Content Layers**
- **Summary Short**: Spoiler-free 150-char hook
- **Summary Medium**: Spoiler-free 400-char overview
- **Full Plot (Spoilers)**: AI-generated detailed breakdown
- **Suspense Breaker**: One-sentence twist reveal
- **AI Trivia**: Quotes, themes, similar recommendations

---

## 🏗️ Architecture Overview

```
User Query
    ↓
Query Parser (extract title, year, season)
    ↓
Auto-detect Complexity
    ↓
Cache Check (IndexedDB 7d, localStorage 6h)
    ↓
╔═══════════════════════════════════════╗
║  PRIMARY: TMDB API                    ║
║  ✓ 100% factual data                  ║
║  ✓ Cast, crew, ratings, images        ║
║  ✓ IMDB ID → OMDB for ratings         ║
╚═══════════════════════════════════════╝
    ↓ (if found)
    ↓
╔═══════════════════════════════════════╗
║  AI ENHANCEMENT                       ║
║  ✓ Creative summaries                 ║
║  ✓ Spoiler breakdowns                 ║
║  ✓ Trivia & recommendations           ║
╚═══════════════════════════════════════╝
    ↓
Merge: TMDB Facts + AI Creative Content
    ↓
Return to User

    ↓ (if NOT found in TMDB)
    ↓
╔═══════════════════════════════════════╗
║  FALLBACK: Perplexity Web Search      ║
║  ✓ Real-time web data                 ║
║  ✓ Recent releases                    ║
║  ✓ Obscure titles                     ║
╚═══════════════════════════════════════╝
    ↓ (if found)
    ↓
AI Enhancement → Return to User

    ↓ (if still NOT found)
    ↓
╔═══════════════════════════════════════╗
║  LAST RESORT: Pure AI                 ║
║  ⚠️ May contain inaccuracies           ║
╚═══════════════════════════════════════╝
```

---

## 🚀 Live Demo

Visit the live app: **[https://moviemonk-ai.vercel.app](https://moviemonk-ai.vercel.app)**

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite 6
- **AI Providers** (100% FREE):
  - 🆓 **Groq** (Llama 3.3 70B / 3.1 8B) - Unlimited free tier, fastest inference
  - 🆓 **Mistral AI** (Mixtral 8x22B / 8x7B) - 2M tokens/month free
  - 🆓 **OpenRouter** (Meta Llama 3.1) - Emergency fallback
  - 🔍 **Perplexity AI** (Sonar Online) - Web search fallback for recent releases
- **Data Sources**:
  - 📊 **TMDB API** - Primary factual data (cast, crew, images, streaming)
  - ⭐ **OMDB API** - IMDB ratings integration
- **Backend**: Vercel Serverless Functions
- **Caching**: IndexedDB (7 days) + localStorage (6 hours)
- **Deployment**: Vercel
- **Package Manager**: npm

---

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**
- **Vercel Account** (for deployment)
- **Required API Keys** (ALL FREE):
  - [Groq API Key](https://console.groq.com) - Unlimited free tier ⚡ **REQUIRED**
  - [TMDB API Key](https://www.themoviedb.org/settings/api) - Free tier (v3 + v4) **REQUIRED**
  - [OMDB API Key](http://www.omdbapi.com/apikey.aspx) - 1000 req/day free **REQUIRED**
- **Optional But Recommended**:
  - [Mistral API Key](https://console.mistral.ai) - 2M tokens/month free
  - [OpenRouter API Key](https://openrouter.ai/keys) - Emergency fallback
  - [Perplexity API Key](https://www.perplexity.ai/settings/api) - For recent releases

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/mfscpayload-690/moviemonk-ai.git
cd moviemonk-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory (see `.env.local.example`):

```env
# Required
GROQ_API_KEY=your_groq_api_key_here
TMDB_API_KEY=your_tmdb_v3_api_key_here
TMDB_READ_TOKEN=your_tmdb_v4_read_token_here
OMDB_API_KEY=your_omdb_api_key_here

# Optional but recommended
MISTRAL_API_KEY=your_mistral_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**Note**: Minimum required keys are GROQ_API_KEY, TMDB_API_KEY, TMDB_READ_TOKEN, and OMDB_API_KEY.

### 4. Development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### 5. Production build
```bash
npm run build
npm run preview
```

---

## 🌐 Deployment to Vercel

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mfscpayload-690/moviemonk-ai)

### Manual Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Add Environment Variables**
```bash
vercel env add GROQ_API_KEY
vercel env add TMDB_API_KEY
vercel env add TMDB_READ_TOKEN
vercel env add OMDB_API_KEY
vercel env add MISTRAL_API_KEY
vercel env add OPENROUTER_API_KEY
vercel env add PERPLEXITY_API_KEY
```

4. **Deploy to Production**
```bash
vercel --prod
```

Your app will be live at `https://your-project.vercel.app`

**Canonical Domain**: [https://moviemonk-ai.vercel.app](https://moviemonk-ai.vercel.app)

---

## 🎯 How It Works

### Query Processing
1. **Parse**: Extract title, year, season, episode from natural language
   - "You season 5" → `{title: "You", season: 5, type: "show"}`
   - "Interstellar 2014" → `{title: "Interstellar", year: 2014}`

2. **Auto-Complexity**: Detect if query needs complex model
   - Recent years (2024-2025) → Complex
   - Season/episode queries → Complex
   - Keywords like "detailed plot" → Complex

3. **Cache Check**: IndexedDB (7 days) → localStorage (6 hours)

### Data Flow
1. **TMDB Search** (PRIMARY)
   - Search title + year in TMDB database
   - Fetch cast, crew, genres, release dates
   - Get IMDB ID from external_ids endpoint
   - Fetch IMDB ratings from OMDB API
   - Get streaming providers (where to watch)
   - Fetch images, trailers, gallery

2. **AI Enhancement** (if TMDB found)
   - Send factual context to AI (Groq/Mistral/OpenRouter)
   - AI generates ONLY creative content:
     - `summary_short`: 150-char spoiler-free hook
     - `summary_medium`: 400-char spoiler-free overview
     - `summary_long_spoilers`: Full detailed plot
     - `suspense_breaker`: One-sentence twist
     - `ai_notes`: Trivia, quotes, recommendations
   - Merge: TMDB facts + AI creative = Final result

3. **Perplexity Fallback** (if TMDB not found)
   - Search web using Perplexity Sonar Online model
   - Extract factual data from current web sources
   - AI enhance creative content
   - Return web data + AI summaries

4. **Pure AI Last Resort** (if both fail)
   - Full AI generation (legacy mode)
   - ⚠️ May contain inaccuracies for obscure titles

### Cache Strategy
- **IndexedDB**: 7 days (reduced from 30 for accuracy)
- **localStorage**: 6 hours (reduced from 24 for fresh data)
- Cache key: `{provider}_{normalized_query}`

---
vercel --prod
```

The proxy will be available at `https://your-project.vercel.app/api/openrouter`.

**For local testing with Vercel dev:**
```bash
vercel dev
```

See `api/README.md` for detailed proxy setup instructions.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build for Production

```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 🚢 Deployment

### Vercel (Recommended)

The repository is already configured for Vercel. Deploy from your local machine or CI:

```bash
vercel login
vercel env pull .env.local   # optional: sync env vars locally
vercel env add GROQ_API_KEY
vercel env add MISTRAL_API_KEY
vercel env add OPENROUTER_API_KEY
vercel env add TMDB_API_KEY
vercel env add TMDB_READ_TOKEN
vercel --prod
```

- The canonical production URL is **https://moviemonk-ai.vercel.app**.
- Each `vercel --prod` also creates a unique preview URL (e.g., `moviemonk-xxxxx.vercel.app`). Share only the canonical domain to avoid stale builds.
- Optional: add a custom domain in the Vercel dashboard so the alias always points to the latest deployment.

For alternate hosts (Netlify, Railway, etc.), run `npm run build` and serve the `dist/` folder, ensuring the same environment variables are provided.

---

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design, data flows, and integration points
- [Deployment Guide](docs/DEPLOYMENT.md) - Step-by-step deployment instructions
- [Development Guide](docs/DEVELOPMENT.md) - Local setup, workflows, and contribution guidelines
- [API Integration](docs/API.md) - Groq, Mistral & TMDB API usage patterns

---

## 🗂️ Project Structure

```
moviemonk-ai/
├── .github/
│   └── copilot-instructions.md # Guidance for AI assistants (no CI workflow)
├── asset/                      # Static assets (logo, images)
├── components/                 # React components
│   ├── ChatInterface.tsx       # User input and conversation UI
│   ├── MovieDisplay.tsx        # Movie/show details renderer
│   ├── ErrorBanner.tsx         # Error notifications
│   └── icons.tsx               # SVG icon components
├── services/
│   ├── groqService.ts          # Groq AI integration (Llama 3.3)
│   ├── mistralService.ts       # Mistral AI integration
│   └── tmdbService.ts          # TMDB API integration
├── docs/                       # Documentation
├── App.tsx                     # Main application component
├── constants.ts                # Prompts, schemas, configuration
├── types.ts                    # TypeScript type definitions
├── index.tsx                   # App entry point
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

---

## 🎯 Usage

1. **Search for content**: Type a movie, show, actor, or director name
2. **Choose complexity**:
   - Toggle off (Simple/Flash): Fast queries, basic info
   - Toggle on (Complex/Pro): Deep analysis, detailed breakdowns
3. **Explore results**:
   - View cast, crew, ratings, and "where to watch" links
   - Play trailers inline
   - Reveal spoiler sections with a click
4. **Browse gallery**: High-quality images from TMDB

---

## 🤝 Contributing

Contributions are welcome! Please read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---
