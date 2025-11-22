# MovieMonk 🎬

Search for any movie or TV show and get accurate info with AI-powered summaries. Features cast details, ratings, trailers, and where to stream.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://moviemonk-ai.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<img width="1726" height="996" alt="image" src="https://github.com/user-attachments/assets/cdb11c56-63fa-4720-9946-2e85b7f9d0c5" />


---

## ✨ What You Get

- **Accurate Data**: Real cast, crew, and ratings from TMDB & IMDB
- **AI Summaries**: Get spoiler-free overviews or full plot breakdowns
- **Where to Watch**: See streaming options (Netflix, Prime, etc.)
- **Trailers & Images**: Watch trailers and browse movie galleries
- **Smart Search**: Just type naturally - "Inception", "Breaking Bad season 5", etc.
- **Chat History**: Continue conversations about different movies

---

## 🔍 How It Works

1. **You search** for a movie or show
2. **We check TMDB** for accurate cast, ratings, and images
3. **AI writes** the summaries and trivia
4. **You get** everything in one clean view

For recent or obscure titles, we also search the web to find info.

---

## 🚀 Live Demo

Visit the live app: **[https://moviemonk-ai.vercel.app](https://moviemonk-ai.vercel.app)**

---

## 🛠️ Built With

- **React + TypeScript** - UI and type safety
- **Tailwind CSS** - Styling
- **Vite** - Fast builds
- **AI**: Groq, Mistral, OpenRouter (all free APIs)
- **Data**: TMDB & OMDB APIs (also free)
- **Hosting**: Vercel

---

## 📋 What You Need

- **Node.js** 18 or newer
- **Free API Keys** (sign up takes 2 minutes):
  - [Groq](https://console.groq.com) - For AI summaries
  - [TMDB](https://www.themoviedb.org/settings/api) - For movie data
  - [OMDB](http://www.omdbapi.com/apikey.aspx) - For IMDB ratings
- **Optional** (but nice to have):
  - [Mistral](https://console.mistral.ai) - Backup AI provider
  - [OpenRouter](https://openrouter.ai/keys) - Another backup
  - [Perplexity](https://www.perplexity.ai/settings/api) - For new releases

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

**Note**: You need at least Groq, TMDB, and OMDB keys to run the app.

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 🚢 Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login and add your API keys**
```bash
vercel login
vercel env add GROQ_API_KEY
vercel env add TMDB_API_KEY
vercel env add TMDB_READ_TOKEN
vercel env add OMDB_API_KEY
# Add optional ones if you have them
```

3. **Deploy**
```bash
vercel --prod
```

Your app will be live at `https://your-project.vercel.app`

---

## 📖 More Info

- [API Setup](docs/API.md) - How the AI and data APIs work
- [Caching](docs/CACHING.md) - How we keep things fast
- [Development](docs/DEVELOPMENT.md) - Contributing guidelines

---

## 🗂️ Code Structure

- `components/` - React UI components
- `services/` - AI and API integrations
- `App.tsx` - Main app logic
- `constants.ts` - AI prompts and config
- `types.ts` - TypeScript types

---

## 🎯 Usage

1. **Type a movie name** - "Inception", "Breaking Bad season 5", etc.
2. **Toggle complexity** - Simple for quick info, Complex for detailed analysis
3. **Get results** - Cast, ratings, summaries, streaming links
4. **Click around** - Play trailers, view gallery, reveal spoilers

That's it! The app handles the rest.

---

## 🤝 Contributing

Want to help? Great!

1. Fork the repo
2. Make your changes
3. Submit a pull request

Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for more details.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---
