# MovieMonk 🎬

MovieMonk is an AI-powered movie and TV show discovery platform that provides accurate summaries, real-time data, and comprehensive details about your favorite titles. By combining the power of TMDB, IMDB, and advanced AI models (Groq, Mistral, OpenRouter), MovieMonk delivers a rich, spoiler-free, and interactive experience.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

<img width="1680" height="949" alt="image" src="https://github.com/user-attachments/assets/bc7d9a1a-f5b6-45c0-a032-29e33c2dcc70" />

---

<img width="1810" height="2366" alt="screencapture-moviemonk-ai-vercel-app-2025-12-02-10_28_27" src="https://github.com/user-attachments/assets/7459b355-bd6a-4ee5-89ee-cdfc5e06f418" />

---

<img width="300" height="3802" alt="screencapture-moviemonk-ai-vercel-app-2025-12-02-10_32_39" src="https://github.com/user-attachments/assets/75792c14-5c48-486f-83e1-ad6b64c6ede1" />

---

<img width="250" height="4788" alt="screencapture-moviemonk-ai-vercel-app-2025-12-02-10_44_41" src="https://github.com/user-attachments/assets/8a14da29-7a49-4646-9066-342f6a692a82" />

---

## Features

MovieMonk stands out by integrating verified database information with generative AI context:

*   **Verified Data Sources**: Pulls cast, crew, ratings, and release info directly from TMDB and OMDB.
*   **AI-Generated Summaries**: Utilizes cutting-edge LLMs (via Groq & Mistral) to generate custom plot summaries, trivia, and analysis.
*   **Streaming Availability**: Instantly find where to watch movies/shows on platforms like Netflix, Prime Video, and others.
*   **Search-First Architecture**: Features a robust search system powered by **Google Search (SerpApi)** to handle complex queries, regional titles (Malayalam, Tamil, Telugu, etc.), and disambiguation.
*   **Cinematic UI**: A modern, responsive "Cyberpunk/Dark" aesthetic with glassmorphism effects and smooth animations.
*   **Smart Disambiguation**: Handles ambiguous queries (e.g., "RRR") by presenting a Google-like result list before processing with AI.

---

## Architecture

The application is built on a modern stack focusing on performance and type safety:

*   **Frontend**: React (Vite) + TypeScript
*   **Styling**: Custom CSS variables with a semantic design system (no heavy frameworks)
*   **Data Layer**:
    *   **TMDB API**: Primary source for structured movie metadata.
    *   **SerpApi (Google Search)**: Fallback/Enrichment layer for finding obscure or regional titles.
    *   **Perplexity AI**: Tertiary fallback for deep web context.
*   **AI Layer**:
    *   **Groq**: High-speed inference for movie summaries (Llama 3).
    *   **Mistral**: Specialized model for person/biography data.
    *   **OpenRouter**: Fallback for complex reasoning tasks.
*   **Infrastructure**: Vercel Serverless Functions

---

## Setup & Installation

Follow these steps to run MovieMonk locally:

### 1. Clone the Repository

```bash
git clone https://github.com/mfscpayload-690/moviemonk-ai.git
cd moviemonk-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory. You will need API keys for the services used.

```env
# Core Data APIs
TMDB_API_KEY=your_tmdb_key
OMDB_API_KEY=your_omdb_key
SERPAPI_KEY=your_serpapi_key

# AI Providers
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
OPENROUTER_API_KEY=your_openrouter_key
PERPLEXITY_API_KEY=your_perplexity_key
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Production Build

To build the application for production:

```bash
npm run build
```

---

## Contributing

We welcome contributions to MovieMonk!

1.  **Fork** the repository.
2.  Create a **feature branch**: `git checkout -b feature/new-feature`
3.  **Commit** your changes: `git commit -m 'Add new feature'`
4.  **Push** to the branch: `git push origin feature/new-feature`
5.  Submit a **Pull Request**.

---

## License

This project is licensed under the [MIT License](LICENSE).
