# Verification — 7 September 2026

Story: landing → demo access → dashboard → Index / Spot / Perpetual creation → template → configuration → review → hypothetical scenario → deployment preview → saved READY farm.

## Passed

- Production Next.js build.
- TypeScript typecheck.
- Five domain tests: all 19 template defaults, allocation/name validation, leverage/network limits, scenario/fee effects, and prevention of live execution/fabricated transaction hashes.
- Chrome end-to-end test completes all three families, rejects invalid index totals, saves and reloads a draft, requires scenario review, requires preview acknowledgement, and verifies READY status.
- Chrome mobile test visits landing, overview, farms, templates, analytics, settings and creation at 390px without page overflow; checks template filtering, persisted theme, missing wallet feedback and reset cancellation.
- No page errors recorded during the complete creation journeys.
- Dashboard returns HTTP 200 at http://127.0.0.1:3000/app/dashboard.
- Agent-browser used for live page inspection, interactive snapshots, screenshots and browser error checks.

## Visual evidence

- `screenshots/dashboard-desktop.png`
- `screenshots/configure-desktop.png`
- `screenshots/create-mobile.png`

## Fixes during verification

- Constrained chart SVG flex width to prevent mobile overflow.
- Deferred template query initialization until after mount.
- Updated test selectors for accessible heading text, decorated strategy cards, Next.js route announcements, and navigation completion before reload.

## Boundaries

No live wallet signing, transaction submission, contract deployment, backend authentication, historical backtest, or actual funds flow was tested or enabled. Data persistence is browser localStorage. Simulations are explicitly synthetic. Native dialogs were exercised for opening and cancellation; this is not a formal WCAG audit.
