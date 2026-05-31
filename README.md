# MovieMonk

MovieMonk is a high-performance, AI-orchestrated entertainment discovery engine. It integrates trusted metadata from TMDB with advanced LLM inference to provide users with deep context and actionable insights into movies, TV shows, and industry professionals.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com)

---

## 🚀 Key Capabilities

- **Intent-Aware Discovery**: intelligent landing experience featuring trending spotlight, genre-based filtering, and swipe-optimized carousels.
- **Semantic Search & Disambiguation**: Advanced search ranking that understands person-focused queries and resolves ambiguous names via confidence-based shortlists.
- **AI-Enriched Context**: Layered AI summaries and qualitative explanations generated via Groq (LLM) and Perplexity (Web Search) to augment factual TMDB metadata.
- **Deep Entity Linking**: Seamless navigation between rich title details (synopsis, cast, crew, watch options) and editorial-style person profiles (biography, filmography).
- **Cloud-Synced Watchlists**: Secure user persistence via Supabase Auth, enabling cross-device watchlist management and deep-link sharing.
- **Mobile-First Experience**: Fully responsive, low-latency UI optimized for touch interaction and fast content painting.

## 🛠 Technical Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **Styling**: Vanilla CSS (Modern CSS Variables & Modules) + TailwindCSS
- **Animations**: Framer Motion
- **State & Routing**: React Router v7
- **Database Client**: Supabase JS SDK

### Backend (Inference & Proxy)
- **Engine**: FastAPI (Python 3.11+)
- **AI Infrastructure**: Groq (LPU Inference), Perplexity (Real-time Search Fallback)
- **Data Orchestration**: TMDB API Integration

### Infrastructure
- **Hosting**: Vercel (Frontend), Hugging Face Spaces (Backend)
- **Persistence**: Supabase (PostgreSQL, Row Level Security, Auth)
- **Observability**: Lightweight custom logging and performance debugging utilities

## 🏗 System Architecture

MovieMonk employs a decoupled architecture designed for security, high-concurrency, and resilience.

### Data Flow
1. **Request**: Frontend initiates search or detail fetch.
2. **Cache Check**: System checks IndexedDB (local) and session cache for existing data.
3. **Orchestration**: If uncached, the Backend fetches factual data from TMDB.
4. **AI Enrichment**: The AI Service triggers a fallback chain (Groq → Perplexity) to generate summaries and verify recent data.
5. **Normalization**: Payloads are normalized into consistent Movie/TV/Person schemas.
6. **Delivery**: Data is merged, cached, and rendered via optimized React components.

## 🛡 Engineering Highlights

- **Zero-Trust Client**: Sensitive API keys (TMDB, Groq, Perplexity) are restricted to server-side environments. The frontend only communicates with the backend proxy.
- **Streaming Inference**: Backend leverages FastAPI's asynchronous capabilities to handle high-concurrency AI streaming responses efficiently.
- **Graceful Degradation**: The application maintains functionality (Guest Mode) via local storage persistence if the primary Supabase connection is unavailable.
- **Type Safety**: End-to-end TypeScript implementation ensures rigorous interface adherence and reduces runtime regressions.
- **Automated Quality Checks**: Custom CI scripts (`check:no-emoji`, `security-check`) enforce project-specific coding standards and security audits.

## ⚙️ Development Setup

### Prerequisites
- Node.js 22.x
- Python 3.11+
- TMDB API Key

### 1. Backend Configuration
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Configure TMDB_API_KEY and GROQ_API_KEY
python -m app.main  # or: uvicorn app.main:app --port 8000 --reload
```
*Backend listens on `http://localhost:8000`*

### 2. Frontend Configuration
```bash
# In the root directory
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
*Frontend serves on `http://localhost:3000`*

## 🤝 Contributing

We welcome contributions from the community. Please review our [CONTRIBUTING.md](CONTRIBUTING.md) for architectural guidelines and coding standards.

**Looking for a place to start?** Check out our [Good First Issues](GOOD_FIRST_ISSUES.md) for beginner-friendly tasks.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
