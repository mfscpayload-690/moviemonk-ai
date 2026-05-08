# MovieMonk

MovieMonk is an AI-powered movie and TV discovery experience that helps users go from curiosity to confident watch decisions fast.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview
MovieMonk combines trusted entertainment metadata with high-quality AI explanation.  
It supports both search-first users who know exactly what they want and browse-first users who want to discover what to watch next.

## What You Can Do With MovieMonk
- Discover trending, top-rated, now-playing, and upcoming titles from the landing experience.
- Search movies, series, actors, actresses, and directors with smart ranking and disambiguation.
- Open rich title pages with synopsis, cast/crew context, ratings, and watch options.
- Explore editorial-style person pages with biography, top works, and role-based filmography.
- Move from person profile to movie/show details in one tap.
- Save titles into watchlists and share deep links.

## Core Product Features
- Discovery home with hero spotlight, swipe-friendly carousels, and genre filtering.
- Intent-aware search that understands person-focused queries and role cues.
- Confidence-based resolution that prompts shortlist selection when names are ambiguous.
- TMDB-first data foundation with normalized movie/TV/person payloads.
- AI-enriched summaries layered on factual metadata for better decision support.
- Fast, mobile-optimized UI with loading states and smooth transitions.

## Typical User Flow
1. Start on Discovery and browse what is trending or filter by genre.
2. Open a title to view full details and decide quickly.
3. Search for a person (for example, an actor or director) and review their profile.
4. Tap filmography cards to jump directly into movie/show details.
5. Save promising picks to watchlists and share links with others.

## Technical Architecture

MovieMonk uses a modern, decoupled architecture designed for security, scalability, and high-quality AI inference.

- **Frontend**: React 19 + Vite 7 (hosted on Vercel).
- **Backend**: FastAPI + Python 3.11 (hosted on Hugging Face Spaces).
- **Database**: Supabase (Postgres + Auth).
- **AI Stack**: Groq (LLM Inference), Perplexity (Search Fallback).
- **Data Source**: TMDB API (proxied via backend).

### Why this architecture?
1. **Security**: Sensitive API keys (TMDB, Groq, Perplexity) are kept strictly server-side. The frontend never sees these credentials.
2. **Performance**: FastAPI handles high-concurrency streaming responses for AI summaries more efficiently than Serverless functions.
3. **Open Source**: The architecture allows for easy self-hosting of both the frontend and the inference backend.

## Getting Started (Local Development)

### 1. Prerequisites
- Node.js 22.x
- Python 3.11+
- TMDB API Key

### 2. Backend Setup
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Add your TMDB_API_KEY and GROQ_API_KEY to .env
python main.py
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
```bash
# In the root directory
npm install
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```
The frontend will run on `http://localhost:3000`.

## License
MIT
