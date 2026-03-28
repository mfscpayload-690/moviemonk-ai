---
name: moviemonk-ai
description: "Full build and safety test workflow for MovieMonk UX/Component changes. Validates that UI modifications maintain type safety, component consistency, responsive behavior, and test coverage before deployment. Runs linting, unit tests, integration tests, and regression checks with automated validation of component consistency patterns. WHEN: after making UI component changes, before deploying UX improvements, validating movie/show/person display consistency, ensuring responsive behavior is preserved, testing ambiguity modal or hero metadata changes."
license: MIT
metadata:
  author: Aravind Lal
  version: "1.0.0"
  project: moviemonk-ai
---

# MovieMonk UX Build & Safety Test

> **AUTHORITATIVE WORKFLOW — MANDATORY FOR DEPLOYMENT**
>
> This skill ensures all UI/UX changes are production-ready by validating type safety, component consistency, test coverage, and responsive behavior. **MUST** be completed before merging to `main` branch.

## Triggers

Activate this skill when you want to:
- Validate UX changes across movie/show/person display components
- Ensure component consistency patterns (metadata formatting, spacing, affordances)
- Verify TypeScript types match component implementations
- Test responsive behavior (mobile and desktop viewports)
- Validate that schema changes propagate correctly through the data pipeline (types → services → components)
- Run comprehensive regression testing before deployment
- Check for breaking changes to existing UI behavior

> **Scope**: This skill orchestrates validation of UI/component changes. It does NOT create new components or features — it validates existing changes for safety and consistency.

## Prerequisites

- All target component files edited and saved
- `.env.local` configured with valid `GEMINI_API_KEY` (for local testing)
- No uncommitted changes in unrelated files (clean git state recommended)
- Node modules installed (`npm install` completed)

## Rules

1. **Sequential Validation** — Run steps in order; don't skip stages
2. **Test Isolation** — Run linting first, then unit tests per component, then integration tests
3. **Type Safety First** — Fix TypeScript errors before running tests
4. **100% Pass Rate** — All tests must pass; no known failures allowed
5. **Responsive Coverage** — Test affects both mobile and desktop breakpoints
6. **Component Consistency** — Validate that related components (Movie/TV/Person display) use matching patterns
7. **Zero Regressions** — Integration tests must verify story flows unchanged

---

## Steps

| # | Stage | Action | Validation |
|---|-------|--------|-----------|
| 1 | **Type Check** | `npm run lint` | No TypeScript errors, all imports valid |
| 2 | **Unit Tests** | `npm test -- __tests__/components/` (affected components) | 100% pass (affected files only) |
| 3 | **Integration Tests** | `npm test -- __tests__/integration/userJourneySmoke.test.ts` | 100% pass (user stories intact) |
| 4 | **Consistency Audit** | Visual inspection of component pattern alignment | Component Consistency Checklist section below |
| 5 | **Responsive Verify** | Dev tools: test mobile and desktop viewports | Spacing, affordances, scroll behavior consistent |
| 6 | **Edge Cases** | Manual testing of boundary conditions | Empty states, long text, slow networks |
| 7 | **Report & Approve** | Summarize all validation results | All stages passed, ready for merge |

---

## STAGE 1: Type Check

**Command:**
```bash
npm run lint
```

**Expected Output:**
```
✓ No errors found
✓ All files pass TypeScript checks
```

**Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| `Property 'language' does not exist on type 'MovieData'` | Schema mismatch between types.ts and component | Update types.ts first, then constants.ts INITIAL_PROMPT schema, then components |
| `Cannot find module '@/types'` | Import path incorrect | Verify file exists at path and tsconfig paths are correct |
| `Expected value of type 'string \| undefined' but got 'string'` | Optional field treated as required | Add `?:` to type definition or use optional chaining `?.` in component |
| `Unused variable 'tempVar'` | Dead code from refactoring | Remove variable if not needed, or prefix with `_` if intentional |

**Remediation:** Fix all errors before proceeding to Stage 2. If errors are in unrelated files, they must be resolved first.

---

## STAGE 2: Unit Tests (Component-Specific)

**Target:** Run tests for affected components only to isolate changes

**Command by component type:**
```bash
# Movie/Show display changes
npm test -- __tests__/components/movieDisplay.test.ts
npm test -- __tests__/components/tvShowDisplay.test.ts

# Person display / shortlist changes  
npm test -- __tests__/components/personDisplay.test.ts
npm test -- __tests__/components/ambiguousModal.test.ts

# All component tests (comprehensive)
npm test -- __tests__/components/
```

**Expected Output for each test file:**
```
PASS  __tests__/components/ambiguousModal.test.ts
  AmbiguousModal
    ✓ renders default mode with generic search title (41 ms)
    ✓ renders person-shortlist mode with role cues (4 ms)

Test Suites: 1 passed, 1 total
Tests: 2 passed, 2 total
```

**Common Failures & Fixes:**

| Test | Failure | Root Cause | Fix |
|------|---------|-----------|-----|
| `renders with language field` | Field undefined in output | Language not extracted from TMDB service | Update tmdbService.ts fetchDetails() to extract from `spoken_languages[0].english_name` |
| `metadata uses bullet format` | Expects ` • ` separator, got other text | Component not using `join(' \u2022 ')` | Update component to apply required format: `metadataParts.join(' \u2022 ')` |
| `desktop spacing applied on sm:` | Tailwind class not rendering | Breakpoint not included in template | Verify `sm:px-7 sm:py-5` is in className string, not in conditional |
| `scroll affordance visible on overflow` | Gradient not rendering | Scroll height not constrained or gradient condition wrong | Verify modal has fixed height (h-[92vh]), check canScrollDown state logic |

**Stage 2 Complete When:** All affected component tests pass at 100%

---

## STAGE 3: Integration Tests (Story Validation)

**Command:**
```bash
npm test -- __tests__/integration/userJourneySmoke.test.ts
```

**Expected Output:**
```
PASS  __tests__/integration/userJourneySmoke.test.ts
  User Journey Smoke Tests
    ✓ discovery page loads with hero metadata (120 ms)
    ✓ search results render and filter correctly (85 ms)
    ✓ modal selection resolves to detail view (200 ms)

Test Suites: 1 passed, 1 total
Tests: 3 passed, 3 total
```

**What This Validates:**
- End-to-end user flows unbroken (search → ambiguity → detail)
- Hero metadata visible and formatted correctly
- Modal filtering and selection work
- Detail display renders all sections (overview, cast, similar, etc.)
- No console errors during flow

**If Test Fails:**
1. Check test output for which step broke (e.g., "renders movie detail on selection")
2. Verify component that changed is related to that step
3. Look for console errors in test output
4. May need to update test snapshot or expectations if UI intentionally changed

**Stage 3 Complete When:** 100% of user journey tests pass, no skipped tests

---

## STAGE 4: Consistency Audit

**Component Consistency Checklist:**

### Metadata Format Consistency
- [ ] All detail headers use format: `Year • Type • Language` (e.g., "2014 • Movie • Japanese")
- [ ] For TV: `Year • Type • Language` (e.g., "2024 • TV Series • English")
- [ ] For Person: `Birthday • Location • Department` (e.g., "1970-01-15 • Los Angeles • Acting")
- [ ] Verify bullets use `' \u2022 '` separator (not dash, comma, or other character)
- [ ] Check that genre does NOT appear in hero metadata line (should be in chips row below)

### Field Presence Across Components
Run this search across codebase:
```bash
grep -r "formatDisplayLanguage\|LANGUAGE_NAME_BY_CODE" src/components/
```

Expected: MovieDisplay.tsx and TVShowDisplay.tsx both have these; PersonDisplay does not (person doesn't have language field)

### Responsive Spacing Validation
- [ ] Desktop breakpoint: `sm:px-7 sm:py-5` applied to card rows (ambiguous modal shortlist)
- [ ] Mobile: Default `px-4 py-3` preserved for small screens
- [ ] Thumbnail sizes: `sm:w-24 sm:h-32` for person avatars on desktop
- [ ] No hardcoded pixels; all spacing uses Tailwind utilities

### Scroll Behavior Validation
- [ ] Modal has fixed height: `h-[92vh] max-h-[92vh]` mobile, `h-[86vh] max-h-[86vh]` desktop
- [ ] Outer dialog locked to `overflow-hidden` (prevents competing scroll)
- [ ] Inner results list set to `overflow-y-auto` (exclusive scroll target)
- [ ] Top/bottom gradient affordances render when overflow exists
- [ ] "Scroll for more" hint visible on first render, hides after first scroll

### No Regressions in Related Sections
- [ ] Movie/Show detail pages still render full content (plot, cast, media gallery)
- [ ] Person detail page shows biography and filmography
- [ ] Search results still filterable by all tabs (Movies, Shows, People)
- [ ] Keyboard shortcuts still functional (if applicable)

**Audit Complete When:** All checkboxes validated via code inspection or manual testing

---

## STAGE 5: Responsive Verification

**Test on both viewports:**

### Desktop (sm: breakpoint, 768px+)
```bash
# Command to start dev server in separate terminal
npm run dev
```
1. Open http://localhost:3000 in browser
2. Open DevTools (F12) → Device Toolbar → Select "Desktop" or iPad Pro
3. Trigger search to show ambiguous modal (e.g., search "Avatar")
4. **Verify:**
   - [ ] Modal is horizontally centered with padding
   - [ ] Metadata shows with bullet separators (Year • Type • Language)
   - [ ] Person shortlist cards have increased padding (sm:px-7 sm:py-5)
   - [ ] Thumbnails are larger on desktop (sm:w-24 sm:h-32)
   - [ ] Scroll affordance gradients visible when content overflows
   - [ ] No horizontal scrollbars appear

### Mobile (default viewport, <640px)
1. In DevTools → Device Toolbar → Select "iPhone 12" or "Pixel 5"
2. Trigger same search flow
3. **Verify:**
   - [ ] Modal fills viewport (bottom sheet style on mobile, h-[92vh])
   - [ ] No padding override breaks mobile layout
   - [ ] Scroll affordances still visible
   - [ ] "Scroll for more" hint readable
   - [ ] Cards fit without horizontal overflow

**Responsive Complete When:** All checks pass on both mobile and desktop

---

## STAGE 6: Edge Cases

**Manual testing scenarios:**

| Scenario | Steps | Expected Outcome |
|----------|-------|------------------|
| Long title | Search for very long movie/show title | Metadata text wraps properly, doesn't break layout |
| Missing language | Search movie with no spoken_languages data in TMDB | Language field empty or shows "Unknown", doesn't crash |
| Many results | Search term with 50+ results | Scroll works smoothly, affordances update, no performance lag |
| Fast scroll to top | Scroll down 10+ items, then scroll to top immediately | "Scroll for more" hint doesn't reappear (shows once per render) |
| No results | Search for gibberish term | Error state displays cleanly, no console errors |
| Slow network | Browser DevTools → Network → Throttle to "Slow 3G" | Data loads incrementally, affordances responsive |

**Edge Cases Complete When:** No unexpected behavior or console errors observed

---

## STAGE 7: Report & Approve

**Generate validation summary:**

```markdown
## MovieMonk UX Build & Safety Test Report

**Date:** [YYYY-MM-DD HH:MM]
**Branch:** improvements/general-ux-polish
**Components Changed:** [list files]

### Validation Results

| Stage | Status | Evidence |
|-------|--------|----------|
| Type Check (npm run lint) | ✅ PASS | 0 errors, 0 warnings |
| Unit Tests | ✅ PASS | 12/12 tests passed |
| Integration Tests | ✅ PASS | 3/3 user journey tests passed |
| Consistency Audit | ✅ PASS | All 8 checkboxes verified |
| Responsive (Desktop) | ✅ PASS | Verified on 1920x1080 viewport |
| Responsive (Mobile) | ✅ PASS | Verified on 375x812 viewport |
| Edge Cases | ✅ PASS | 5/5 scenarios tested |

### Summary

All validation stages passed. The following UX improvements are production-ready:
- Language field now displays in hero metadata (movie/TV)
- Metadata standardized across all detail views (Year • Type • Language)
- Desktop spacing enhanced (increased padding, row height, thumbnails)
- Scroll affordance cues implemented (gradients + hint)
- Modal footer removed; desktop scroll restored

### Approval

✅ **READY FOR MERGE TO MAIN**

Recommendation: Merge to main branch for production deployment.
```

**Report Complete When:** All stages documented with pass/fail evidence

---

## Common Patterns in MovieMonk

### Adding a New Field to MovieData

When adding a field (e.g., `language`), follow this sequence:

1. **types.ts** — Add field to interface:
   ```typescript
   export interface MovieData {
     // ... existing fields
     language?: string;  // Add optional field
   }
   ```

2. **constants.ts** — Update schema AND prompt:
   ```typescript
   export const MOVIE_DATA_SCHEMA = `{
     // ... existing schema
     "language": "string (e.g., 'Japanese', 'Korean')",
   }`;
   
   export const INITIAL_PROMPT = `...
     Include language field extracted from...
   `;
   ```

3. **services/tmdbService.ts** — Extract from API:
   ```typescript
   language: details.spoken_languages[0]?.english_name || details.original_language
   ```

4. **components/MovieDisplay.tsx** — Render with formatting:
   ```typescript
   const formatDisplayLanguage = (code: string) => {
     const LANGUAGE_NAME_BY_CODE = { ja: 'Japanese', ko: 'Korean', ... };
     return LANGUAGE_NAME_BY_CODE[code] || code;
   };
   ```

5. **All Related Components** — Apply same format (TVShowDisplay, PersonDisplay, etc.)

6. **Run Full Validation** — Execute this skill's complete workflow

### Standardizing Metadata Format Across Components

Target pattern: `Year • Type • Language` (bullets with `' \u2022 '` separator)

1. **Update each detail component:**
   ```typescript
   const metadataParts = [
     movieData.releaseYear,
     movieData.type, // "Movie" or "TV Series"
     formatDisplayLanguage(movieData.language)
   ].filter(Boolean);
   
   const metadata = metadataParts.join(' \u2022 ');
   ```

2. **Remove** genre, director, or other fields from hero line (move to chips/sections below)

3. **Test** that metadata appears identically formatted across Movie/TV/Person detail views

4. **Run Stage 2-3** to verify consistency is tested

### Improving Desktop Spacing

Use Tailwind's `sm:` breakpoint (768px+):

```tsx
<div className="px-4 py-3 sm:px-7 sm:py-5">
  {/* mobile: 16px horizontal, 12px vertical */}
  {/* desktop: 28px horizontal, 20px vertical */}
</div>
```

Verify with Stage 5 responsive testing.

---

## Troubleshooting

### Lint Errors After Changes

**Error:** `Property 'X' does not exist on type 'MovieData'`

**Root Causes:**
- Field added to component but not to types.ts interface
- Field added to types.ts but not exported
- Import path to types incorrect in component

**Fix:**
1. Verify types.ts has the field defined
2. Check component imports: `import { MovieData } from '@/types'` (adjust path as needed)
3. Run `npm run lint -- --fix` to auto-fix fixable issues

---

### Test Snapshots Out of Date

**Error:** `Snapshot does not match` or `1 snapshot outdated`

**Root Cause:** Component output changed intentionally (e.g., metadata format), test snapshot needs update

**Fix:**
```bash
npm test -- -u  # Update all snapshots
# OR
npm test -- __tests__/components/ambiguousModal.test.ts -u  # Update specific test
```

**⚠️ Review snapshot diff:** Before committing snapshot updates, inspect the diff to ensure changes are intentional (not bugs).

---

### Tests Pass But Console Errors Appear

**Symptom:** Tests pass, but chrome/browser console shows error about missing field

**Root Cause:** Service not extracting field, component accessing undefined path without null-check

**Fix:**
1. Check service (e.g., tmdbService.ts) to verify field extraction logic
2. Add fallback in component: `movieData.language || ''`
3. Update test mock to include the field with test data
4. Re-run tests to verify console errors gone

---

### Desktop Scrolling Still Broken

**Symptom:** Modal scrolls on mobile but not desktop

**Root Causes:**
- Outer dialog not locked to `overflow-hidden`
- Modal height not constrained (height auto, not fixed vh)
- Results list doesn't have explicit scroll container

**Fix:**
1. Verify modal outer div: `overflow-hidden` (not `overflow-y-auto`)
2. Verify modal container: `h-[86vh] max-h-[86vh]` on sm: breakpoint
3. Verify results list: `overflow-y-auto h-full` to take remaining height
4. Disable any scroll-on-parent logic (e.g., prevent wheel bubbling)

Re-test Stage 5 after fixes.

---

## References

- **MovieDisplay.tsx** — Movie hero + detail rendering
- **TVShowDisplay.tsx** — TV series metadata + cast + similar
- **PersonDisplay.tsx** — Person bio + filmography
- **AmbiguousModal.tsx** — Search result shortlist + modal scroll UX
- **types.ts** — MovieData interface (source of truth for shape)
- **constants.ts** — INITIAL_PROMPT + MOVIE_DATA_SCHEMA (AI instruction + validation)
- **services/tmdbService.ts** — TMDB API extraction + normalization

---

## Checklist for Merge

Before opening a PR or merging to main, verify:

- [ ] Stage 1 (Lint): `npm run lint` passes with 0 errors
- [ ] Stage 2 (Unit): All affected component tests pass (100%)
- [ ] Stage 3 (Integration): User journey smoke tests pass (3/3)
- [ ] Stage 4 (Consistency): Component patterns aligned (checklist above)
- [ ] Stage 5 (Responsive): Desktop and mobile viewports tested
- [ ] Stage 6 (Edge Cases): No regressions in edge scenarios
- [ ] Stage 7 (Report): Validation report generated and reviewed
- [ ] No console errors in browser during manual testing
- [ ] Git commit message references ticket/issue if applicable
- [ ] Latest changes from main branch are pulled (no conflicts)

**Ready to merge when:** All checkboxes checked and no remediations pending.

