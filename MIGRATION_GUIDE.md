# 🎉 FREE AI Providers Migration - Setup Guide

MovieMonk now uses **100% FREE AI providers** with generous limits!

## ✅ What Changed

| Old (Paid) | New (FREE) | Free Tier |
|------------|------------|-----------|
| Google Gemini | **Groq** | ⚡ Unlimited (30 req/min) |
| DeepSeek | **Mistral AI** | 🌟 2M tokens/month |
| OpenRouter | OpenRouter | 🌐 Fallback only |

## 🔑 Get Your FREE API Keys

### 1. Groq (Primary - Fastest)
1. Visit: https://console.groq.com
2. Sign up with Google/GitHub
3. Go to "API Keys" → Create new key
4. Copy your key

**Models used:**
- Simple queries: `llama-3.1-70b-versatile` (fast)
- Complex queries: `llama-3.3-70b-versatile` (best reasoning)

---

### 2. Mistral AI (Secondary - Most Accurate)
1. Visit: https://console.mistral.ai
2. Sign up (free account)
3. Go to "API Keys" → Create new key
4. Copy your key

**Models used:**
- Simple queries: `mistral-small-latest` (efficient)
- Complex queries: `mistral-large-latest` (best quality)

---

### 3. OpenRouter (Fallback)
1. Visit: https://openrouter.ai/keys
2. Sign up
3. Create API key
4. Copy your key

*(Only used if Groq and Mistral both fail)*

---

## 🚀 Deploy to Vercel

### Step 1: Add Environment Variables
```bash
vercel env add GROQ_API_KEY
# Paste your Groq API key when prompted

vercel env add MISTRAL_API_KEY
# Paste your Mistral API key when prompted

vercel env add OPENROUTER_API_KEY
# Paste your OpenRouter API key when prompted

vercel env add TMDB_API_KEY
# Paste your TMDB API key when prompted

vercel env add TMDB_READ_TOKEN
# Paste your TMDB read token when prompted
```

### Step 2: Deploy
```bash
vercel --prod
```

---

## 💻 Local Development

### Step 1: Create `.env.local`
```bash
cp .env.local.example .env.local
```

### Step 2: Edit `.env.local` with your keys
```env
GROQ_API_KEY=gsk_your_groq_key_here
MISTRAL_API_KEY=your_mistral_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
TMDB_API_KEY=your_tmdb_key_here
TMDB_READ_TOKEN=your_tmdb_token_here
```

### Step 3: Run locally
```bash
npm install
npm run dev
```

---

## 🎯 Provider Selection in UI

Users can now choose:
- ⚡ **Groq** - Fastest (300+ tokens/sec), best for quick searches
- 🌟 **Mistral** - Most accurate, best for complex analysis
- 🌐 **OpenRouter** - Emergency fallback

Default: **Groq** (recommended)

---

## 📊 Cost Comparison

| Provider | Before | After |
|----------|--------|-------|
| Gemini | $0.0001/1K tokens (paid after free tier) | **FREE** |
| DeepSeek | $0.14/1M tokens | **FREE** |
| OpenRouter | $0.06-0.30/1M tokens | FREE (fallback only) |

**Your new setup: $0/month!** 🎉

---

## 🔥 Performance Comparison

| Feature | Groq | Mistral | Old (Gemini) |
|---------|------|---------|--------------|
| Speed | ⚡⚡⚡ 300+ tok/sec | ⚡⚡ 100 tok/sec | ⚡ 50 tok/sec |
| Quality | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Rate Limit | 30 req/min | 100 req/min | 10 req/min |
| Free Tier | Unlimited | 2M tokens/month | 60 req/min (limited) |

---

## 🛠️ Troubleshooting

### "Provider unavailable" error
- Check your API keys are correct in Vercel environment variables
- Verify keys are active at provider dashboards
- Try switching to another provider in the UI

### Slow responses
- Use **Groq** for fastest results (300+ tokens/sec)
- Switch to **Simple** query mode for quick lookups
- Cache is enabled - repeat queries are instant

### Rate limit errors
- Groq: 30 requests/minute (very generous)
- Mistral: 100 requests/minute
- Switch providers if you hit limits

---

## 📝 Notes

- **Groq is now the default** (fastest + unlimited free)
- **Mistral is recommended for complex queries** (most accurate)
- **OpenRouter is emergency fallback** (rarely needed)
- All providers support JSON output natively
- TMDB enrichment runs in parallel for speed
- Multi-tier caching (IndexedDB + localStorage) minimizes API calls

---

## 🎊 Benefits of Free Providers

✅ Zero monthly costs
✅ Faster inference (especially Groq)
✅ Higher rate limits
✅ Better JSON output
✅ No billing surprises
✅ Same great movie data!

---

**Questions?** Open an issue on GitHub!
