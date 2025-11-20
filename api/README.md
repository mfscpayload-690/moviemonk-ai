# Serverless API Proxy

This directory contains Vercel serverless functions that act as a secure backend proxy for API requests.

## OpenRouter Proxy (`/api/openrouter`)

### Why?
OpenRouter's API has CORS restrictions that prevent direct browser calls. This proxy:
- Runs on the backend (Vercel Edge Functions)
- Keeps your API key secure (server-side only)
- Bypasses CORS issues

### Setup for Vercel Deployment

1. **Install Vercel CLI** (if not already):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Add Environment Variable**:
   ```bash
   vercel env add OPENROUTER_API_KEY
   ```
   When prompted, paste your OpenRouter API key.

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Local Development

To test the proxy locally:

1. **Install Vercel CLI** (if not done):
   ```bash
   npm i -g vercel
   ```

2. **Run Vercel dev server**:
   ```bash
   vercel dev
   ```

3. **In another terminal, start Vite**:
   ```bash
   npm run dev
   ```

The proxy will be available at `http://localhost:3000/api/openrouter`.

### How It Works

**Client** → `/api/openrouter` (Vercel Function) → **OpenRouter API** → **Response back to client**

- Client sends: `{ model, messages, max_tokens, temperature }`
- Proxy adds: `Authorization: Bearer <API_KEY>` (from env)
- Proxy returns: OpenRouter's JSON response

### Environment Variables

Make sure these are set in:
- **Vercel Dashboard**: Project Settings → Environment Variables
- **Local `.env.local`**: For local development (if using `vercel dev`)

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Troubleshooting

**Error: "OpenRouter API key not configured"**
- Solution: Add `OPENROUTER_API_KEY` to Vercel environment variables

**Error: 502 Bad Gateway**
- Solution: Check Vercel function logs in dashboard

**Error: "Failed to fetch"**
- Solution: Ensure Vercel deployment is live and URL is correct
