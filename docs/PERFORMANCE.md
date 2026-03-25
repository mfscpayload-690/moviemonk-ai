## Perf Debugging

- Enable perf instrumentation by running with `VITE_PERF_DEBUG=true npm run dev`.
- In perf mode the app logs:
  - Long tasks via `PerformanceObserver (longtask)` with duration.
  - Render counts for `App`, `MovieDisplay`, and `PersonDisplay`.

## What We Measured
- Baseline: Search actions triggered multiple rerenders of the full app and watchlist modal; long cast lists caused scroll jank.
- Observed main-thread spikes from synchronous cache cleanup and large list rendering.

## Fixes Implemented
- Added render-count and long-task logging guarded by `VITE_PERF_DEBUG`.
- Memoized handlers and wrapped heavy state updates in `startTransition` to keep input updates urgent.
- Virtualized large lists (cast grid when expanded, watchlist items) and added `content-visibility: auto` to heavy sections to defer painting.
- Moved cache and IndexedDB cleanup to idle time to avoid blocking interactions.
- Standardized icons (emoji-free) and reduced unnecessary state (progress/messages) to cut rerenders.

## How to Verify
- With `VITE_PERF_DEBUG=true`, perform a search and expand cast lists; render counts should stay steady and long-task logs should remain sparse.
- Scroll long cast lists and large watchlists; scrolling should remain smooth without layout thrash.
- Toggle watchlists modal and search island while typing to confirm UI remains responsive.
