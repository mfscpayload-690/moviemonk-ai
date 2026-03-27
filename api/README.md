# Serverless API Proxy

This directory contains Vercel serverless functions that act as a secure backend proxy for API requests.

## Notifications Dispatch (`/api/notifications/dispatch`)

Queues notification events for users based on saved preferences:

- Channels: `in_app`, `email`, `push`
- Frequency: `daily`, `weekly`

### Request

- Method: `POST`
- Query or body: `frequency` (`daily` or `weekly`)
- Optional header: `x-notification-secret` (required if `NOTIFICATION_DISPATCH_SECRET` is set)

### Environment variables

- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOTIFICATION_DISPATCH_SECRET` (recommended)

## Notifications Processing (`/api/notifications/process`)

Processes queued events from `notification_events`:

- In-app channel: marks queued events as `sent` for inbox display
- Email channel: sends via Resend and marks `sent`/`failed`
- Push channel: currently marked `failed` until provider adapter is added

### Required env vars for email delivery

- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL` (verified sender identity)

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
