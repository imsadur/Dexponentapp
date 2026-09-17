# Dexponent product-flow audit

Audit date: 2026-09-15  
Surface: Dashboard v3 and the connected local demo Farm lifecycle  
Capture tool: Codex in-app browser

## Overall verdict

The main lifecycle is now connected end to end. Dashboard v3 links to supported product modules, demo deployment opens the correct Farm workspace, deposits create portfolio positions, partial withdrawals update those positions, and a paused Farm remains visible and withdrawable. The static export resolves every internal destination checked.

## Flow steps

1. **Dashboard v3 — healthy.** The sidebar contains nine distinct destinations across Portfolio, Farms, Operations, and Workspace. Unsupported placeholder modules and duplicate links were removed. Search, performance ranges, notifications, wallet settings, profile settings, Farm rows, and activity rows now respond or navigate.
2. **Farm creation — healthy.** Strategy and template selection advance into the shared configuration flow. The form exposes the Farm identity, network, asset, protocol, strategy, capacity, risk, fees, and advanced settings with visible progress.
3. **Review and simulation — healthy.** Review shows the final configuration and its limits. Simulation must be reviewed before deployment can continue, and the UI labels the figures as hypothetical.
4. **Demo deployment — healthy.** The acknowledgement gates deployment. Completion creates an Active demo Farm and opens its management workspace using a static-export-safe query route.
5. **Farm management — healthy.** The deployed Farm supports a demo deposit, partial or full withdrawal, and eligible manager pause/resume controls. Pause requires a confirmation and disables new deposits.
6. **Positions — healthy.** Positions now represent the user's `demoPosition` balance instead of total Farm TVL. Active and paused balances remain listed, so a paused Farm can still be opened for withdrawal.
7. **Route integrity — healthy.** Ten supported dashboard destinations were opened in the in-app browser, and the production export check resolved all 19 unique internal destinations with no missing page.

## Highest-impact changes

- Replaced title-changing placeholder navigation with real route links.
- Removed Pools, Managers, Swap, Liquidity, Rewards, Activity, duplicate Overview/Capital, duplicate Strategies/Templates, and duplicate Analytics/Market/Rankings/Stats entries from Dashboard v3.
- Connected row actions, recent activity, profile, wallet, notifications, search, and chart range controls.
- Corrected Portfolio semantics so Positions use LP demo balances and remain available while a Farm is paused.
- Added a browser regression journey for navigation, creation, deployment, deposit, withdrawal, pause, and position persistence.

## Accessibility notes and limits

- All retained icon-only controls have accessible names; selected chart ranges expose `aria-pressed`; the notification popover has a named dialog role; and tables use semantic rows and headers.
- Keyboard focus order and screen-reader announcements were checked through the browser accessibility tree. A full audit with multiple assistive technologies and manual contrast measurement was outside this screenshot-based review.

## Evidence

The audit captured the original cluttered Dashboard v3, a placeholder destination that changed only the heading, the simplified route-backed Dashboard v3, the deployed Farm management state, and the final Positions state in the current in-app browser run. The verified prototype remains open at `/preview/dashboard/v3/`.
