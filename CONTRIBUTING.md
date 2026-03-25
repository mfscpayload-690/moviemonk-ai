# Contributing to MovieMonk

Thanks for helping improve the project! Please follow the steps below to keep changes smooth and reviewable.

## How to contribute
1. **Fork and branch**: create a feature branch from `main` (e.g., `feature/search-copy-update` or `fix/cache-key`).
2. **Set up locally**: install dependencies (`npm install`) and configure `.env.local` with the required API keys.
3. **Make focused changes**: keep PRs small and scoped to one concern.
4. **Validate**:
   - Tests: `npm test -- --runInBand`
   - Type check: `npm run lint`
   - Build: `npm run build`
5. **Submit a PR**: describe the change, risks, and any configuration updates. Include screenshots when UI changes are visible.

## Coding expectations
- Keep TypeScript types up to date and prefer typed helpers over `any`.
- Preserve shared utilities in `api/_utils` (CORS, observability, error helpers) when touching API routes.
- Avoid committing secrets or `.env` files; environment variables belong in deployment settings.

## Reporting issues
Open an issue with a clear description, steps to reproduce, and expected vs. actual behavior. For security concerns, follow `SECURITY.md`.
