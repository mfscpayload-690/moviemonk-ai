# MovieMonk 🎬

AI-powered movie and series search engine with plot summaries, cast info, spoiler-safe explanations, and real-time "where to watch" links. Built with **Google Gemini AI**, **TMDB API**, and a modern web stack.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-sgtv3jh28-mfscpayload-690.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![MovieMonk Banner](asset/MovieMonk%20Logo.png)

---

## ✨ Features

- 🤖 **AI-Powered Search**: Ask anything about movies, shows, actors, directors, or songs
- 🎭 **Comprehensive Information**: Cast, crew, ratings (IMDb, Rotten Tomatoes), genres, year
- 🎥 **Media Rich**: Official trailers, posters, backdrops, and gallery images from TMDB
- 📖 **Smart Summaries**: Spoiler-free synopses + detailed spoiler breakdowns
- 🔍 **Where to Watch**: Real-time streaming/rental/purchase links
- ⚡ **Two Query Modes**: 
  - Simple (Gemini Flash) for quick lookups
  - Complex (Gemini Pro) for deep analysis
- 🎨 **Modern UI**: Dark theme with smooth animations and responsive design

---

## 🚀 Live Demo

Visit the live app: **[https://moviemonk-sgtv3jh28-mfscpayload-690.vercel.app](https://moviemonk-sgtv3jh28-mfscpayload-690.vercel.app)**

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite 6
- **AI Providers** (100% FREE):
  - 🆓 **Groq** (Llama 3.3 70B) - Fastest inference, unlimited free tier
  - 🆓 **Mistral AI** (Mistral Large/Small) - 2M tokens/month free
  - 🆓 **OpenRouter** - Emergency fallback (via serverless proxy)
- **Data**: The Movie Database (TMDB) API
- **Backend**: Vercel Serverless Functions
- **Deployment**: Vercel
- **Package Manager**: npm

---

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**
- **Vercel Account** (for deployment)
- **100% FREE API Keys**:
  - [Groq API Key](https://console.groq.com) - Unlimited free tier ⚡
  - [Mistral API Key](https://console.mistral.ai) - 2M tokens/month free 🌟
  - [OpenRouter API Key](https://openrouter.ai/keys) - Emergency fallback
  - [TMDB API Key](https://www.themoviedb.org/settings/api) (v3 API Key or v4 Read Access Token)

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
Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
TMDB_READ_TOKEN=your_tmdb_v4_read_token_here
TMDB_API_KEY=your_tmdb_v3_api_key_here
```

**Note**: You need at least one AI provider API key and one TMDB credential.

### 4. Deploy the OpenRouter Proxy (Required for OpenRouter)

OpenRouter requires a serverless backend to bypass CORS restrictions:

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Add OpenRouter API key as environment variable
vercel env add OPENROUTER_API_KEY

# Deploy to Vercel
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

### GitHub Pages (Automated)

This project includes a GitHub Actions workflow for automatic deployment:

1. **Push your code** to the `main` branch
2. **Add secrets** in your GitHub repo:
   - Go to `Settings` → `Secrets and variables` → `Actions`
   - Add: `GEMINI_API_KEY`, `TMDB_READ_TOKEN`, `TMDB_API_KEY`
3. **Enable GitHub Pages**:
   - Go to `Settings` → `Pages`
   - Source: **GitHub Actions**
4. The workflow automatically builds and deploys on every push to `main`

**Live URL**: `https://<your-username>.github.io/moviemonk-ai/`

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Other Platforms

- **Railway**: Auto-detects Node.js, add env vars in dashboard
- **Vercel/Netlify**: Connect GitHub repo, set build command to `npm run build`

---

## 📖 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design, data flows, and integration points
- [Deployment Guide](docs/DEPLOYMENT.md) - Step-by-step deployment instructions
- [Development Guide](docs/DEVELOPMENT.md) - Local setup, workflows, and contribution guidelines
- [API Integration](docs/API.md) - Gemini & TMDB API usage patterns

---

## 🗂️ Project Structure

```
moviemonk-ai/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── asset/                      # Static assets (logo, images)
├── components/                 # React components
│   ├── ChatInterface.tsx       # User input and conversation UI
│   ├── MovieDisplay.tsx        # Movie/show details renderer
│   ├── ErrorBanner.tsx         # Error notifications
│   └── icons.tsx               # SVG icon components
├── services/
│   ├── geminiService.ts        # Google Gemini AI integration
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
