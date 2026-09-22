# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in MovieMonk, please **do not** open a public GitHub issue. Instead, please follow these steps:-

### Report Process

1. **Email us directly** at your organization's security contact (or open a private security advisory on GitHub)
2. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce (if possible)
   - Potential impact
   - Suggested fix (if you have one)

3. **Wait for confirmation** before making any public disclosures

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Assessment:** Within 48 hours
- **Fix & Patch:** Within 1-2 weeks (depending on severity)
- **Release:** Public disclosure after fix is deployed

## Supported Versions

We follow semantic versioning and support:
- Latest major version (`main` branch) - **Full support**
- Previous major version - **Security patches only**
- Older versions - **No support**

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   - Run `npm audit` and `uv run pip-audit` regularly
   - Enable Dependabot in your fork
   - Update to latest version when patches are released

2. **Environment Variables**
   - Store frontend secrets in `.env.local` (never commit)
   - Store backend secrets in `server/.env` (never commit)
   - Use hosting platform environment variables (Vercel / Hugging Face Spaces) for production
   - Never log sensitive data or access tokens

3. **CORS & API Security**
   - External APIs (TMDB, OMDB, Groq, Mistral) are proxied through the dedicated FastAPI backend
   - Third-party API keys are server-side only and never exposed to the client
   - Shared watchlist URLs use cryptographically random URL-safe tokens

### For Contributors

1. **Code Review**
   - All PRs require review before merge
   - Security-sensitive changes require additional scrutiny (auth, CORS, rate limits)

2. **Dependency Management**
   - Use `npm audit` for frontend and `pip-audit` for backend before committing
   - Run `npm run security-check` before PRs
   - Keep dependencies up-to-date and pinned

3. **Data Handling**
   - User data is secured in Supabase PostgreSQL with Row Level Security (RLS)
   - Sensitive query params are automatically redacted in observability logs
   - Security response headers (CSP, HSTS, X-Content-Type-Options) are enforced on all routes

## Known Security Controls

### Client-Side

- **Content Security Policy (CSP)** - Prevents XSS attacks and restricts connect-src/img-src
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **Referrer-Policy** - Limits referrer information leakage
- **No Client Secrets** - Only public `VITE_*` keys bundled in frontend assets

### Server-Side (FastAPI Backend)

- **HTTPS/TLS** - All communication encrypted in transit
- **Strict CORS Policy** - Whitelisted origins only with preflight validation
- **JWT Verification** - `PyJWT[crypto]` verifies Supabase auth tokens with signature and expiration checks
- **Rate Limiting** - Multi-tier token-bucket and sliding-window rate limiters (Redis + local in-memory fallback) on mutation and AI proxy routes (HTTP 429 + `Retry-After`)
- **Input Validation** - Bounded Pydantic models preventing payload exhaustion / DoS
- **Observability Sanitization** - Automatic query string credential and token masking in JSON logs
- **Hardened API Docs** - OpenAPI/Swagger endpoints disabled in production by default (`ENABLE_API_DOCS=false`)

## Dependency Security

### Current Status

- ✅ Frontend: All production dependencies audited clean
- ✅ Backend: Audited via `pip-audit` (0 known CVEs)
- ✅ Dependabot enabled for automated vulnerability alerts

### Audit Process

Run security checks before each release:

```bash
# Frontend
npm run security-check

# Backend
cd server && uv run pip-audit
```

## Security Features

### URL Sharing

- Secure URL-safe base64 tokens
- No sensitive keys or user credentials in query parameters
- Enforcement of public/private visibility permissions at database and API layers

### Data Handling

- User profiles and personal watchlists guarded by Supabase RLS
- Search history stored in localStorage only on the user's device
- Sensitive logs redacted before emission to structured JSON log streams

### API Integrations

- TMDB, OMDB, Groq, Mistral, and TVMaze are proxied through FastAPI
- Server-side rate limiting prevents quota exhaustion and resource abuse
- Upstream error details sanitized before returning responses to clients

## Compliance

- ✅ OWASP Top 10 hardened
- ✅ CSP Level 3 compliant
- ✅ HSTS preload ready
- ✅ No mixed-content
- ✅ Secure token and cookie handling

## Questions?

For security questions or concerns, contact: security@moviemonk.ai

For vulnerability reports: Use the process above.

---

**Last Updated:** September 2026  
**Version:** 1.0.0  
**Maintainer:** MovieMonk Security Team
