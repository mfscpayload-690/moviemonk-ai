# Contributing to MovieMonk

Thank you for your interest in contributing to MovieMonk! This document outlines the process for submitting improvements and maintaining the project's engineering standards.

## Contribution Workflow

1.  **Fork & Branch**: Create a descriptive feature branch from `main` (e.g., `feat/search-optimization` or `fix/auth-callback`).
2.  **Environment Setup**: Install dependencies via `npm install` and configure your local `.env.local` using the provided `.env.example`.
3.  **Atomic Changes**: Keep Pull Requests focused and scoped to a single concern to facilitate efficient code review.
4.  **Verification**:
    *   **Unit Tests**: `npm test -- --runInBand`
    *   **Static Analysis**: `npm run lint`
    *   **Build Validation**: `npm run build`
5.  **Submission**: Submit a PR with a comprehensive description of the changes, potential risks, and any necessary configuration updates. Include visual evidence (screenshots/recordings) for UI-facing changes.

## Engineering Standards

- **Type Safety**: Maintain rigorous TypeScript definitions. Avoid the use of `any` and prefer interface-driven development.
- **Architectural Integrity**: Adhere to the decoupled architecture. Ensure server-side logic remains in the `server/` directory and shared utilities are utilized correctly.
- **Security**: Never commit secrets or sensitive environment variables. Follow the guidelines in `SECURITY.md`.
- **Code Quality**: Ensure all new code adheres to the project's linting rules and formatting standards.

## Good First Issues

If you are new to the repository, we recommend starting with our curated list of [Good First Issues](GOOD_FIRST_ISSUES.md). These tasks are designed to provide a low-friction entry point into the codebase.

## Reporting Vulnerabilities

For security-related issues, please refer to our [SECURITY.md](SECURITY.md) for the responsible disclosure process. For general bugs, open a GitHub issue with clear reproduction steps.
