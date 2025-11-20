# Server-Side Caching with Vercel KV

## What is Vercel KV?

**Vercel KV** is a serverless Redis database that runs on Vercel's edge network. It's designed for:
- ⚡ Ultra-fast data access (sub-millisecond latency)
- 🌍 Global distribution (data stored close to users worldwide)
- 🔄 Simple key-value storage (like a giant dictionary/hashmap)
- 💰 Pay-as-you-go pricing (free tier available)

Think of it as a super-fast storage locker that exists "in the cloud" where you can store and retrieve data instantly.

---

## Why Use It?

### Problem:
Every time someone searches "Interstellar", your app:
1. Calls Gemini API (costs money + takes 5-10 seconds)
2. Calls TMDB API (takes 1-2 seconds)
3. User waits ~7-12 seconds total

If 1000 people search "Interstellar" today, you make 1000 API calls!

### Solution with Vercel KV:
1. **First user** searches "Interstellar":
   - Call APIs (slow)
   - **Save result to Vercel KV** 
   - Serve to user

2. **Next 999 users** search "Interstellar":
   - **Read from Vercel KV** (instant < 10ms)
   - No API calls needed
   - Save 99.9% of costs and time!

---

## How It Works

```
User Query → Check Vercel KV → Found? Return instantly
                              ↓
                           Not Found? 
                              ↓
                         Call AI APIs
                              ↓
                      Save to Vercel KV
                              ↓
                       Return to user
```

###Edge Caching Levels:

1. **Browser Cache (localStorage)** - 24 hours
   - Fastest (instant)
   - Per-user only
   - Limited storage (~10MB)

2. **Vercel KV (Redis)** - 7 days  
   - Very fast (10-50ms)
   - **Shared across ALL users globally**
   - Unlimited storage

3. **AI APIs** - No cache
   - Slowest (5-15 seconds)
   - Costs money per request

---

## Redis Explained Simply

**Redis** = Remote Dictionary Server

It's like a giant JavaScript object that lives on a server:

```javascript
// Normal JavaScript object (only in your browser)
const cache = {
  "interstellar_2014": { title: "Interstellar", year: "2014", ... },
  "inception_2010": { title: "Inception", year: "2010", ... }
};

// Redis (same idea, but on the server, accessible worldwide)
await kv.set("interstellar_2014", { title: "Interstellar", ... });
const movie = await kv.get("interstellar_2014"); // Anyone can access this
```

### Key Features:
- **Key-Value Store**: Like a dictionary where you store data with a unique key
- **In-Memory**: Data stored in RAM (super fast, not on slow disks)
- **Persistence**: Data survives server restarts
- **Expiration**: Automatically delete old data (TTL = Time To Live)

---

## CDN-Level Caching

**CDN** = Content Delivery Network

Think of it as copying your website to 100+ locations worldwide:

```
User in Tokyo → Nearest CDN (Tokyo) → Instant response
User in London → Nearest CDN (London) → Instant response
User in NYC → Nearest CDN (NYC) → Instant response
```

### How Vercel Uses CDNs:

1. **Edge Functions**: Your serverless API runs in 20+ global regions
2. **KV Store**: Redis database replicated to all edges
3. **Static Assets**: HTML/CSS/JS cached at CDN edge

Result: No matter where users are, they get fast responses!

---

## Implementation Steps

### 1. Create Vercel KV Database

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Create KV store
vercel kv create moviemonk-cache

# Link to project
vercel link
```

### 2. Add Environment Variables

Vercel automatically adds these to your project:
```env
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

### 3. Install SDK

```bash
npm install @vercel/kv
```

### 4. Use in API Route

```typescript
// api/search.ts
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { query } = req.body;
  const cacheKey = `movie:${query.toLowerCase()}`;
  
  // Check cache first
  const cached = await kv.get(cacheKey);
  if (cached) {
    return res.json({ data: cached, cached: true });
  }
  
  // Not in cache, call AI
  const result = await callGeminiAPI(query);
  
  // Save to cache for 7 days
  await kv.set(cacheKey, result, { ex: 60 * 60 * 24 * 7 });
  
  return res.json({ data: result, cached: false });
}
```

---

## Caching Strategy

### What to Cache:
✅ **Popular titles** (Interstellar, Inception, etc.)
✅ **Simple queries** (no chat history)
✅ **Complete responses** (with TMDB data)

### What NOT to Cache:
❌ **Follow-up questions** (context-dependent)
❌ **User-specific data**
❌ **Partial/incomplete responses**

### Cache Duration:
- **Hot Cache** (frequently accessed): 7 days
- **Warm Cache** (occasionally accessed): 24 hours  
- **Cold Cache** (rarely accessed): Auto-evict

---

## Pricing

### Vercel KV Free Tier:
- 30GB bandwidth/month
- 200k commands/month
- ~20,000 movie searches/month
- More than enough for starting out!

### Paid Tier ($20/month):
- 512GB bandwidth
- 10M commands
- ~1 million movie searches/month

---

## Pre-Fetching Popular Titles

### The Idea:
Instead of waiting for users to search, **pre-load popular movies** into the cache!

```typescript
// scripts/prefetch.ts
const TOP_100_MOVIES = [
  "Interstellar 2014",
  "Inception 2010",
  "The Dark Knight 2008",
  // ... 97 more
];

async function prefetchPopularMovies() {
  for (const query of TOP_100_MOVIES) {
    console.log(`Fetching ${query}...`);
    
    // Call your AI API
    const result = await fetchMovieData(query);
    
    // Save to Vercel KV
    await kv.set(`movie:${query.toLowerCase()}`, result, { ex: 60 * 60 * 24 * 30 }); // 30 days
    
    // Also save to IndexedDB for offline access
    await saveToIndexedDB(query, result);
    
    // Wait 2 seconds to avoid rate limits
    await sleep(2000);
  }
  
  console.log("✅ Pre-fetched 100 popular movies!");
}
```

### Run it:
```bash
# Run once when deploying
npm run prefetch

# Or set up a cron job to refresh weekly
vercel cron add "0 0 * * 0" "npm run prefetch"
```

### Result:
- Top 100 movies load **instantly** for all users
- Saves thousands of API calls
- Better UX for 80% of searches

---

## IndexedDB for Client-Side

**IndexedDB** = Browser's built-in database (like Redis, but in the browser)

### Why Use Both?

| Storage | Speed | Sharing | Capacity |
|---------|-------|---------|----------|
| **Vercel KV** | 10-50ms | All users | Unlimited |
| **IndexedDB** | <1ms | Per-user only | ~50MB-1GB |
| **localStorage** | <1ms | Per-user only | ~10MB |

### Strategy:
1. Check **IndexedDB** first (instant)
2. If not found, check **Vercel KV** (fast)
3. If not found, call **AI** (slow)
4. Save result to both **IndexedDB** + **Vercel KV**

---

## Summary

**What we're building:**
1. ✅ **localStorage** - Per-user, 24hr cache
2. ✅ **Vercel KV** - Global, 7-day cache (NEW!)
3. ✅ **IndexedDB** - Per-user, 30-day cache for top 100 movies (NEW!)
4. ✅ **Pre-fetching** - Background load popular titles (NEW!)

**Expected Performance:**
- **Before**: 7-12 seconds per search
- **After**: 
  - Cached: < 100ms (98% of searches)
  - Uncached: 7-12 seconds (2% of searches)

**Cost Savings:**
- **Before**: $0.002 per search × 10,000 searches = $20/month
- **After**: $0.002 × 200 searches = $0.40/month (98% cache hit rate!)

---

Need help with any of these concepts? Let me know!
