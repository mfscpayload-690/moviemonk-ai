# Deployment Guide

How to deploy MovieMonk to production.

---

## Recommended: Vercel
1. Install and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Add environment variables (repeat for each key you use):
   ```bash
   vercel env add TMDB_API_KEY
   vercel env add TMDB_READ_TOKEN
   vercel env add OMDB_API_KEY
   vercel env add GROQ_API_KEY
   vercel env add MISTRAL_API_KEY
   vercel env add OPENROUTER_API_KEY
   vercel env add PERPLEXITY_API_KEY   # optional
   vercel env add SERPAPI_KEY          # optional
   vercel env add REDIS_URL            # optional
   ```
3. Deploy:
   ```bash
   npm run build       # confirm it succeeds locally
   vercel --prod
   ```
Your app is live at the URL Vercel prints. Re-run `vercel --prod` after future changes.

## Other hosting options

### Railway
1. Create a Railway project from this repo.
2. Build command: `npm run build`; Start command: `npm run preview`.
3. Add the same environment variables listed above (including `REDIS_URL` if you want server caching).
4. Deploy from the Railway dashboard.

### Netlify
1. Import from Git and set:
   - Build command: `npm run build`
   - Publish directory: `dist`
2. Add required environment variables.
3. Deploy from the Netlify UI or CLI.

## Self-host (VPS / Docker)

### Using Node + PM2

```bash
# On your VPS
git clone https://github.com/YOUR_USERNAME/moviemonk-ai.git
cd moviemonk-ai

# Install dependencies
npm install

# Create .env.local with your API keys
nano .env.local

# Build
npm run build

# Install PM2
npm install -g pm2

# Serve with PM2
pm2 serve dist 3000 --spa
pm2 save
pm2 startup
```

### Using Nginx (Static Hosting)

```bash
# Build locally
npm run build

# Upload dist/ to VPS
scp -r dist/* user@your-vps:/var/www/moviemonk/

# Nginx config
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/moviemonk;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | Groq API key for AI queries (primary provider) |
| `MISTRAL_API_KEY` | Recommended | Mistral API key (backup provider) |
| `OPENROUTER_API_KEY` | Recommended | OpenRouter API key (fallback provider) |
| `TMDB_API_KEY` | **Yes** | TMDB v3 API Key for movie data |
| `TMDB_READ_TOKEN` | Recommended | TMDB v4 Read Access Token (preferred over v3) |
| `OMDB_API_KEY` | **Yes** | OMDB API key for IMDB ratings |
| `PERPLEXITY_API_KEY` | Optional | Perplexity API for web search (recent releases) |
| `SERPAPI_KEY` | Optional | Suggestion/search enrichment |
| `REDIS_URL` | Optional | Redis endpoint for shared server caching |

**Note**: You need at least Groq, TMDB, and OMDB credentials to run the app. Mistral and OpenRouter provide backup/fallback functionality.

---

## Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] Search functionality works
- [ ] Images display correctly (poster, backdrop, gallery)
- [ ] Trailers play
- [ ] "Where to watch" links populate
- [ ] Both Simple and Complex query modes work
- [ ] Mobile responsive design works
- [ ] Favicon displays
- [ ] Console has no critical errors

---

## Monitoring & Analytics

### Add Google Analytics (Optional)

1. Get tracking ID from Google Analytics
2. Add to `index.html` before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Rollback Strategy

### GitHub Pages

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Other Platforms

Most platforms (Railway, Vercel, Netlify) allow rollback to previous deployments via their dashboards.

---

## Performance Optimization

**For Production:**
- Enable Gzip/Brotli compression on server
- Use CDN for static assets
- Implement caching headers
- Consider lazy-loading images
- Add service worker for offline support (PWA)

---

## Support

For deployment issues:
- Check platform status pages
- Review build logs in Actions tab (GitHub)
- Verify environment variables are set correctly
- Test locally first: `npm run build && npm run preview`
