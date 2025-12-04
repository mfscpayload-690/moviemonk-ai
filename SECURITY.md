# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in MovieMonk, please **do not** open a public GitHub issue. Instead, please follow these steps:

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
   - Run `npm audit` regularly
   - Enable Dependabot in your fork
   - Update to latest version when patches are released

2. **Environment Variables**
   - Store API keys in `.env.local` (never commit)
   - Use Vercel environment variables for production
   - Never log sensitive data

3. **CORS & API Security**
   - All external API requests go through Vercel serverless functions
   - API keys are server-side only
   - Share links are URL-safe encoded

### For Contributors

1. **Code Review**
   - All PRs require review before merge
   - Security-sensitive changes require additional scrutiny

2. **Dependency Management**
   - Use `npm audit` before committing
   - Run `npm run security-check` before PRs
   - Keep dependencies up-to-date

3. **Data Handling**
   - Never store user data without consent
   - Use secure headers (CSP, HSTS, etc.)
   - Sanitize user inputs

## Known Security Controls

### Client-Side

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **Referrer-Policy** - Limits referrer information leakage

### Server-Side

- **HTTPS/TLS** - All communication encrypted
- **No Server Components** - Client-side React only, no SSR vulnerabilities
- **API Key Isolation** - Keys stored as environment variables
- **Rate Limiting** - Implemented via Vercel/API providers

## Dependency Security

### Current Status (Updated: December 2024)

- ✅ React: ^19.2.1 (patched for CVE-2025-55182)
- ✅ React-DOM: ^19.2.1 (patched)
- ✅ All production dependencies audited
- ✅ Dependabot enabled for automated checks

### Audit Process

Run the security check before each release:

```bash
npm run security-check  # runs audit + lint + build
```

## Security Features

### URL Sharing

- Links are URL-encoded (safe)
- No sensitive data in query params
- Links expire on logout (cache only)

### Data Handling

- No user database (stateless)
- Search history in localStorage only (user's device)
- API responses cached securely
- No third-party tracking (except Vercel Analytics)

### API Integrations

- TMDB, OMDB, Groq, Mistral, etc. are called server-side via Vercel functions
- API keys never exposed to client
- Requests authenticated server-side only

## Compliance

- ✅ OWASP Top 10 hardened
- ✅ CSP Level 3 compliant
- ✅ HSTS preload ready
- ✅ No mixed-content
- ✅ Secure cookie handling

## Questions?

For security questions or concerns, contact: [your security contact]

For vulnerability reports: Use the process above.

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Maintainer:** MovieMonk Security Team
