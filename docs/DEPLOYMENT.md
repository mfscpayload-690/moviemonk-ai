# Deployment Guide

Complete guide for deploying MovieMonk to various platforms.

---

## GitHub Pages (Recommended)

### Prerequisites
- GitHub account
- Repository with code pushed
- API keys (Gemini, TMDB)

### Step-by-Step Deployment

#### 1. Push Code to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Add API Secrets
1. Go to your repo: `https://github.com/YOUR_USERNAME/moviemonk-ai`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these three secrets:

| Secret Name | Value |
|------------|-------|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `TMDB_READ_TOKEN` | Your TMDB v4 Read Access Token |
| `TMDB_API_KEY` | Your TMDB v3 API Key |

#### 3. Enable GitHub Pages
1. In **Settings**, go to **Pages**
2. Under **Source**, select: **GitHub Actions**
3. Click **Save**

#### 4. Update Base Path (if needed)
The `vite.config.ts` should already have:
```typescript
base: process.env.GITHUB_ACTIONS ? '/moviemonk-ai/' : '/',
```

**Replace `/moviemonk-ai/`** with your actual repository name if different.

#### 5. Trigger Deployment
```bash
# Make any change (or trigger workflow manually)
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

#### 6. Monitor Deployment
1. Go to **Actions** tab on GitHub
2. Watch "Deploy to GitHub Pages" workflow
3. Wait for green checkmark ✅ (~2-3 minutes)

#### 7. Access Your Site
Your app will be live at:
```
https://YOUR_USERNAME.github.io/moviemonk-ai/
```

### Troubleshooting GitHub Pages

**Issue: Workflow doesn't appear**
- Ensure `.github/workflows/deploy.yml` is pushed
- Refresh the Actions tab after 10-20 seconds

**Issue: Build fails with "API key not valid"**
- Double-check secret names (must be exact)
- Verify no extra spaces in secret values
- Re-add secrets if needed

**Issue: Site loads but images/CSS missing**
- Verify `base` in `vite.config.ts` matches repo name
- Check browser console for 404 errors
- Ensure path starts and ends with `/`

**Issue: Blank page after deployment**
- Check browser console for errors
- Verify build completed successfully in Actions
- Try hard refresh (Ctrl+Shift+R)

---

## Railway

### Quick Deploy

1. **Sign up**: [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. **Connect**: Select `moviemonk-ai` repository
4. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm run preview`
5. **Add Environment Variables**:
   - `GEMINI_API_KEY`
   - `TMDB_READ_TOKEN`
   - `TMDB_API_KEY`
6. **Deploy**: Railway auto-deploys

### Railway Configuration

Railway auto-detects Node.js projects. No additional configuration needed.

**Custom Domain (Optional):**
- Go to project settings
- Add custom domain
- Update DNS records as instructed

---

## Vercel

### Deploy via GitHub

1. **Sign up**: [vercel.com](https://vercel.com)
2. **New Project** → **Import Git Repository**
3. **Select**: `moviemonk-ai` repository
4. **Configure**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Environment Variables**:
   - Add `GEMINI_API_KEY`, `TMDB_READ_TOKEN`, `TMDB_API_KEY`
6. **Deploy**

### Vercel CLI (Alternative)

```bash
npm install -g vercel
vercel login
vercel
```

Follow prompts and add environment variables when asked.

---

## Netlify

### Deploy via GitHub

1. **Sign up**: [netlify.com](https://netlify.com)
2. **Add new site** → **Import from Git**
3. **Connect**: Select `moviemonk-ai` repository
4. **Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. **Environment Variables**:
   - Add `GEMINI_API_KEY`, `TMDB_READ_TOKEN`, `TMDB_API_KEY`
6. **Deploy**

### Netlify CLI (Alternative)

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Self-Hosting (VPS/Docker)

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
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for AI queries |
| `TMDB_READ_TOKEN` | Recommended | TMDB v4 Read Access Token (preferred) |
| `TMDB_API_KEY` | Optional | TMDB v3 API Key (fallback) |

**Note**: You need at least one TMDB credential (`TMDB_READ_TOKEN` is preferred).

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

## Continuous Deployment

### GitHub Actions (Automatic)

The included workflow (`.github/workflows/deploy.yml`) automatically:
1. Builds on every push to `main`
2. Runs tests (if added)
3. Deploys to GitHub Pages
4. Takes ~2-3 minutes per deployment

### Manual Trigger

You can manually trigger deployment from GitHub:
1. Go to **Actions** tab
2. Select "Deploy to GitHub Pages"
3. Click **Run workflow**

---

## Custom Domain Setup

### GitHub Pages

1. Add `CNAME` file to `public/` with your domain:
   ```
   moviemonk.yourdomain.com
   ```
2. In GitHub repo settings → Pages → Custom domain
3. Add your domain and enforce HTTPS
4. Update DNS:
   ```
   CNAME  moviemonk  YOUR_USERNAME.github.io
   ```

### Railway/Vercel/Netlify

Follow platform-specific custom domain instructions in their dashboards.

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
