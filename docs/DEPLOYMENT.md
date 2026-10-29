# Deployment Guide

How to deploy MovieMonk to production.

---

## Recommended Deployment Model

MovieMonk uses a decoupled deployment model:
1. **Frontend**: Deployed to **Vercel** (Static site & client assets).
2. **Backend**: Deployed to **Hugging Face Spaces** (Docker container running FastAPI on port 7860) or any container host / VPS.

---

## 1. Frontend: Vercel Deployment

1. Install and log in:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Add frontend environment variables:
   ```bash
   vercel env add VITE_API_BASE_URL               # e.g., https://your-space.hf.space
   vercel env add VITE_SUPABASE_URL               # https://your-project.supabase.co
   vercel env add VITE_SUPABASE_ANON_KEY          # your public anon key
   vercel env add VITE_VAPID_PUBLIC_KEY           # optional web push public key
   vercel env add VITE_SENTRY_DSN                 # optional Sentry DSN
   vercel env add VITE_INDEXNOW_KEY               # optional IndexNow key
   ```
3. Deploy:
   ```bash
   npm run build       # confirm it succeeds locally
   vercel --prod
   ```

---

## 2. Backend: Hugging Face Spaces / Docker Deployment

The backend resides in `server/` with a production Dockerfile.

1. Create a Hugging Face Space (SDK: Docker).
2. Configure **Space Secrets** (or environment variables in your container runner):
   - `TMDB_API_KEY` (Required)
   - `TMDB_READ_TOKEN` (Required / Recommended)
   - `OMDB_API_KEY` (Optional, enables IMDb / RT ratings)
   - `GROQ_API_KEY` (Required for AI features)
   - `VIBE_SEARCH_API_KEY` (Optional secondary Groq key)
   - `PERPLEXITY_API_KEY` (Optional search fallback)
   - `SERPAPI_KEY` (Optional web search)
   - `SUPABASE_URL` (For backend operations)
   - `SUPABASE_SERVICE_ROLE_KEY` (For admin DB operations)
   - `SUPABASE_JWT_SECRET` (For verifying user auth tokens)
   - `ALLOWED_ORIGINS` (Comma-separated, e.g. `https://moviemonk-ai.vercel.app,http://localhost:3000`)
   - `REDIS_URL` (Optional Redis connection string)
   - `SENTRY_DSN` (Optional Sentry monitoring DSN)
   - `ENABLE_API_DOCS` (`false` in production)
3. The Space will build and serve FastAPI on port 7860.

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

### Frontend Variables (`.env.local` / Vercel)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | **Yes** | Base URL for FastAPI backend (e.g. `https://your-space.hf.space` or `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | **Yes** | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase public anonymous key |
| `VITE_VAPID_PUBLIC_KEY` | Optional | Web push VAPID public key |
| `VITE_SENTRY_DSN` | Optional | Sentry React SDK DSN |
| `VITE_INDEXNOW_KEY` | Optional | Search engine IndexNow key |
| `VITE_GOOGLE_SITE_VERIFICATION` | Optional | Google Search Console verification code |
| `VITE_BING_SITE_VERIFICATION` | Optional | Bing Webmaster Tools verification code |

### Backend Variables (`server/.env` / Hugging Face Space Secrets)

| Variable | Required | Description |
|---|---|---|
| `TMDB_API_KEY` | **Yes** | TMDB v3 API key |
| `TMDB_READ_TOKEN` | Recommended | TMDB v4 Read Access Token |
| `GROQ_API_KEY` | **Yes** | Groq API key for LPU AI inference |
| `VIBE_SEARCH_API_KEY` | Optional | Secondary Groq key for round-robin load distribution |
| `OMDB_API_KEY` | Optional | OMDB API key for IMDb, Rotten Tomatoes, and Metacritic scores |
| `PERPLEXITY_API_KEY` | Optional | Perplexity API key for web search fallback |
| `SERPAPI_KEY` | Optional | SerpApi key for search suggestions enrichment |
| `SUPABASE_URL` | Optional | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key (bypasses RLS for backend operations) |
| `SUPABASE_JWT_SECRET` | Optional | JWT secret for verifying Supabase user tokens |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated CORS allowed origins |
| `REDIS_URL` | Optional | Redis connection string for response caching and distributed rate limiting |
| `ENABLE_API_DOCS` | Optional | Set to `true` to enable Swagger `/api/docs` (default `false`) |
| `SENTRY_DSN` | Optional | Sentry Python SDK DSN |

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

When a deployment introduces regressions, roll back to a known stable version immediately.

### 1. Vercel
- **Dashboard**: Go to your Project -> **Deployments** tab. Locate the last stable deployment, click the three dots (`...`), and select **Rollback**.
- **CLI**: Roll back to a specific deployment ID:
  ```bash
  vercel rollback <deployment-id>
  ```

### 2. Railway
- Go to your Railway project dashboard.
- Select the active service, click on the **Deployments** tab, find the previous stable deployment, and click **Redeploy** or **Rollback**.

### 3. Netlify
- Go to Project -> **Deploys**.
- Select the previous successful deployment and click **Publish Deploy** to set it active.
- Note: If auto-publishing is locked, you will need to unlock it first.

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
