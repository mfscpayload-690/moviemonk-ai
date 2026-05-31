# Good First Issues

Welcome to the MovieMonk codebase! If you are looking to make your first contribution, we have curated a list of starter tasks that are scoped, well-documented, and excellent for getting familiar with our architecture.

---

## 1. Expand Unit Test Coverage

- **Target Component**: [ActionToast.tsx](file:///home/mfscpayload-690/Desktop/moviemonk-ai/components/ActionToast.tsx) and [GenrePills.tsx](file:///home/mfscpayload-690/Desktop/moviemonk-ai/components/GenrePills.tsx)
- **Goal**: Currently, these lightweight components have low coverage. Create dedicated Jest test files under `__tests__/components/` to verify their rendering, props propagation, and event handlers.
- **Where to look**:
  - `components/ActionToast.tsx`
  - `components/GenrePills.tsx`
  - Existing component tests in `__tests__/components/` (e.g., `ambiguousModal.test.ts`) as a reference.

---

## 2. Standardize Spoken Language Mapping

- **Target Component**: [MovieDisplay.tsx](file:///home/mfscpayload-690/Desktop/moviemonk-ai/components/MovieDisplay.tsx) and [TVShowDisplay.tsx](file:///home/mfscpayload-690/Desktop/moviemonk-ai/components/TVShowDisplay.tsx)
- **Goal**: Expand the internal helper `formatDisplayLanguage` to support common ISO codes. Currently, some less common language codes fall back to their raw abbreviation. Adding a comprehensive map of ISO-639-1 language codes (e.g., `hi` -> `Hindi`, `es` -> `Spanish`, `de` -> `German`) will standardize the hero metadata.
- **Where to look**:
  - Look for `formatDisplayLanguage` inside `components/MovieDisplay.tsx` and standardise it or extract it into a shared helper in `lib/`.

---

## 3. Keyboard Navigation in Shortlist Modal

- **Target Component**: [AmbiguousModal.tsx](file:///home/mfscpayload-690/Desktop/moviemonk-ai/components/AmbiguousModal.tsx)
- **Goal**: When multiple search results are found for a query, a shortlist modal opens. Enable keyboard users to navigate up and down the list of choices using the Arrow keys (`ArrowUp`/`ArrowDown`) and confirm selection with `Enter`.
- **Where to look**:
  - `components/AmbiguousModal.tsx`
  - Focus tracking and keyboard event handlers in the shortlist container.

---

## 4. Add CSS Theme Presets

- **Target Component**: [modern.css](file:///home/mfscpayload-690/Desktop/moviemonk-ai/styles/modern.css)
- **Goal**: MovieMonk uses modern CSS variables for theme token management. Add support for a new sleek design preset (e.g., "Nordic Forest" or "Cyberpunk Neon") by introducing a set of HSL color definitions that can be toggled via data-attributes.
- **Where to look**:
  - `styles/modern.css` - Check the root CSS variables and add a secondary theme set.

---

## Setup & Submission Guidelines

1. Follow the local setup instructions in the [Development Guide](docs/DEVELOPMENT.md).
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Verify your changes pass checks locally:
   - Run type check and lint: `npm run lint`
   - Run existing unit tests: `npm test`
   - Run production build: `npm run build`
4. Open a Pull Request referencing the issue you chose.
