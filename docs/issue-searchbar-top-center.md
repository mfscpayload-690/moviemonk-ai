## Title
Move search bar to top-center between MovieMonk logo/title and Watchlists

## Summary
The current search control (`DynamicSearchIsland`) is fixed at the bottom-center of the viewport. We need it at the top-center of the header, visually between the left brand block (logo + `MovieMonk`) and the right actions (`Watchlists`, `Share`).

## Current UI behavior (from code)
- Header layout is in `App-Responsive.tsx` using `justify-between` with:
  - Left: logo + title
  - Right: watchlist/share buttons
- Search is rendered separately at app root level via `<DynamicSearchIsland />`.
- Positioning is controlled by `styles/dynamic-search-island.css` with fixed bottom styles:
  - `.search-island { bottom: ...; left: 50%; transform: translateX(-50%); }`
  - Desktop override currently shifts to `left: 41%`.

## Goal
Place the collapsed search bar at the top-center so it appears in the header region between brand and actions, while preserving existing search behavior (expand/collapse, keyboard shortcuts, submit flow).

## Scope (MVP)
1. Header integration
   - In `App-Responsive.tsx`, position `DynamicSearchIsland` in the header center region instead of floating at bottom.
   - Keep left brand and right watchlist/share controls unchanged functionally.

2. Search positioning updates
   - Update `styles/dynamic-search-island.css` so default/collapsed state supports top-center placement in header context.
   - Remove desktop `left: 41%` offset and any bottom-only assumptions for the default placement.

3. Keep behavior intact
   - Do not change search logic in `DynamicSearchIsland.tsx` (`onSearch`, query handling, analysis toggle, keyboard handlers).
   - Preserve accessibility labels and keyboard interactions (`/`, `k`, `Esc`, `Enter`).

## Non-goals
- No redesign of watchlists modal.
- No changes to query backend/API behavior.
- No new animations or extra components.

## Acceptance criteria
- Search bar is visually centered in the top header area between brand and action buttons on desktop.
- On mobile, header remains usable and search does not overlap/clip watchlist button.
- Existing search flows still work end-to-end (collapsed → expanded → submit).
- Keyboard shortcuts still function as before.
- No regressions in watchlist button visibility/clickability.

## Files likely to change
- `App-Responsive.tsx`
- `styles/dynamic-search-island.css`
- (Only if required) small responsive utility tweaks in `styles/modern.css`

## Validation checklist
- Desktop: verify top-center placement at common widths (1280, 1024).
- Mobile: verify no overlap at 375/390 widths.
- Functional: run a search and confirm result rendering is unchanged.
- A11y: focus/keyboard still usable for open/close/submit.
