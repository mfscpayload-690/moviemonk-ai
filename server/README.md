---
title: Moviemonk Backend
emoji: 🎬
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# MovieMonk AI Backend Service

FastAPI backend service powering the **MovieMonk AI** discovery platform.

## Features
- **Vibe-based AI Parsing**: Uses Groq LLMs to extract intents, genres, and discovery parameters from natural queries.
- **Multi-Source Enrichment**: Aggregates metadata from TMDB, OMDB, Wikipedia, and Wikimedia supplementary assets.
- **Smart Disambiguation**: Employs custom entity resolvers with similarity matching to route search intents perfectly.
- **Hugging Face Docker Space**: Optimized production container listening on port `7860`.
