# MovieMonk 🎬

AI-powered movie and series search engine with plot summaries, cast info, spoiler-safe explanations, and real-time "where to watch" links. Built with **Google Gemini AI**, **TMDB API**, and a modern web stack.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://mfscpayload-690.github.io/moviemonk-ai/)
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

Visit the live app: **[https://mfscpayload-690.github.io/moviemonk-ai/](https://mfscpayload-690.github.io/moviemonk-ai/)**

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite 6
- **AI**: Google Gemini 2.5 (Flash & Pro) with Google Search grounding
- **Data**: The Movie Database (TMDB) API
- **Deployment**: GitHub Pages via GitHub Actions
- **Package Manager**: npm

---

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Git**
- API Keys:
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey)
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
GEMINI_API_KEY=your_gemini_api_key_here
TMDB_READ_TOKEN=your_tmdb_v4_read_token_here
TMDB_API_KEY=your_tmdb_v3_api_key_here
```

**Note**: You need at least `GEMINI_API_KEY` and one TMDB credential (`TMDB_READ_TOKEN` is preferred).

### 4. Run the development server
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

## 🙏 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for powerful AI capabilities
- [The Movie Database (TMDB)](https://www.themoviedb.org/) for comprehensive movie data
- [Vite](https://vitejs.dev/) for blazing-fast build tooling
- [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/) for modern UI development

---

## 📞 Contact

**Project Link**: [https://github.com/mfscpayload-690/moviemonk-ai](https://github.com/mfscpayload-690/moviemonk-ai)

**Live Demo**: [https://mfscpayload-690.github.io/moviemonk-ai/](https://mfscpayload-690.github.io/moviemonk-ai/)

---

**Built with ❤️ by the MovieMonk team**
