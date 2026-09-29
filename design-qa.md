# Dexponent Version 3 Design QA

Source visual truth: `/Users/saadrahman/Downloads/Dexponent_IA_Wireframes_Codex_Brief.pdf` (pages 3-14), with `/Users/saadrahman/Desktop/Screenshot 2026-09-15 at 7.10.45 PM.png` used only as the page-index reference.

Implementation captures:

- `/Users/saadrahman/Documents/ArdourLabs/FMDashboard/artifacts/design-qa/landing-v3-full.png`
- `/Users/saadrahman/Documents/ArdourLabs/FMDashboard/artifacts/design-qa/dashboard-v3-full.png`
- `/Users/saadrahman/Documents/ArdourLabs/FMDashboard/artifacts/design-qa/landing-v3-comparison.png`
- `/Users/saadrahman/Documents/ArdourLabs/FMDashboard/artifacts/design-qa/dashboard-v3-comparison.png`

Viewport: 1440 x 1000 CSS px, device scale factor 1. Landing capture: 1440 x 7482 px. Dashboard capture: 1440 x 1429 px. PDF pages were rendered at 120 DPI and scaled proportionally beside the implementation captures for comparison.

State: dark theme, public landing page with all Farms visible, logged-in dashboard preview with Portfolio / Overview active, simulated values settled after animation.

## Findings

- No remaining P0, P1, or P2 issues.
- Fonts and typography: Outfit display hierarchy, wide headings, compact financial labels, and readable body copy match the premium fintech direction. The hero remains within three lines at desktop and mobile widths.
- Spacing and layout rhythm: the landing page follows the required ten-section order with clear chapter spacing. Farm cards fill the 12-column dense grid without empty cells. Dashboard metrics, chart, allocation, positions, and activity use consistent spacing and alignment.
- Colors and visual tokens: the restrained dark palette, neutral borders, lavender action color, green positive states, and amber risk states are consistent across both surfaces and meet the source direction without generic crypto effects.
- Image and asset fidelity: the supplied Dexponent mark, actual token logos, actual chain logos, and Phosphor interface icons are used. The low-fidelity source contains no photographic or illustrative assets requiring generation.
- Copy and content: Strategy, Farm, Position, Portfolio, and Manage follow the PDF definitions. Mock values are labeled Demo, Simulated, or Estimated. Security content avoids unsupported claims.

## Full-view comparison evidence

- Landing: the comparison confirms Navigation, Hero, Live Protocol Snapshot, Explore Farms, How It Works, audience paths, Strategy to Farm to Position, Why Dexponent and Security, Ecosystem, and final CTA/footer appear in the required order.
- Dashboard: the comparison confirms grouped Explore, Trade, Portfolio, Manage, and Data and More navigation, plus the required Portfolio and Manage mental models.

## Focused region comparison evidence

- Hero: dominant Explore Farms and Launch a Farm actions, concise support copy, and a visible capital-flow preview match the wireframe intent.
- Explore: functional category filters, real token and chain assets, APY, TVL, risk, and strategy context make the cards operational rather than decorative.
- Dashboard navigation: Create Farm, Strategies, Templates, LPs, Analytics, Market, Farm Rankings, Protocol Stats, Docs, Learn, Security, and Support are present in the specified groups.
- Dashboard content: portfolio value, net deposits, rewards, managed capital, performance, allocation, positions, managed Farms, and activity establish the requested application handoff.

## Comparison history

1. Initial comparison found one P1 IA gap in Dashboard v3: Manage omitted Strategies and Create Farm, while Data and More condensed several required destinations.
2. Added Strategies and Create Farm to Manage; expanded Data and More to Market, Farm Rankings, Protocol Stats, Docs, Learn, Security, and Support.
3. Re-captured both pages after animations settled. The post-fix comparison has no actionable P0, P1, or P2 mismatch.

## Interaction and runtime verification

- Landing mobile navigation opens and closes.
- Farm filters update the visible opportunity set.
- Dashboard mobile navigation opens and section selection updates the heading and supporting copy.
- Version index exposes six routes and identifies v3 as Current.
- Landing v2 and Dashboard v2 retain their original headings and component paths.
- Browser console: no errors or warnings on either v3 route.
- Browser suite: 5 tests passed, including v3 routes, filtering, responsive layouts, v2 preservation, Farm creation, deployment, trading, deposit, and workspace flows.

## Follow-up polish

- No blocking polish remains. A future iteration can connect the explicitly labeled demo metrics to production data APIs.

final result: passed

## Compact chart and direct execution controls — 2026-09-29

- Removed the TradingView text label while retaining the chart experience and controls.
- Increased the chart tabs, timeframes, OHLC legend, moving-average legend, order-book tabs, and depth-row typography.
- Set the chart and order-book panels to the same compact 600px desktop height while retaining eight asks and eight bids.
- Replaced the order-book kebab menu with visible Buy & sell, Buy only, and Sell only depth controls plus the price-increment selector.
- Removed the repeated pair title and Long/Short selector from the order ticket.
- Added persistent Long and Short actions with strong green and red treatments; each action submits its explicit side and respects Reduce only constraints.
- Increased spacing and type size in the pre-submit order metrics.
- Verified depth filtering, 16 visible order-book levels, direct long/short placement, Reduce only behavior, responsive layout, and an error-free browser console.

final result: passed

## Trading depth and activity refinement — 2026-09-29

- Pair identity now uses a single base-token logo and the asset’s full name.
- The market selector behaves as a large anchored dropdown beneath the pair header while preserving workspace context.
- Market price matches the other metric values in size and uses green, red, or neutral white according to the 24-hour direction.
- The order book displays eight asks and eight bids simultaneously with larger labels, prices, quantities, totals, and boxed B/S ratio markers.
- Positions, Open orders, Trade history, and Order history now share one compact tabbed workspace with a purpose-built table schema for each tab.
- Verified all four tabs, market dropdown, 16 order-book levels, order placement, reduce-only flow, responsive layout, and browser console.

final result: passed

## Trading header refinement — 2026-09-29

- Replaced the persistent market column with a focused market picker opened from the pair header.
- The picker presents Token, Price, 24h change, and 24h volume in a searchable, filterable table and keeps all columns visible at compact widths.
- Pair metadata now uses the asset’s full name, such as Ethereum or Solana.
- Removed secondary helper labels and vertical separators from the market metrics strip.
- Replaced “Back to Farm” text with an accessible back icon and changed the adjacent title to the active Farm name.
- Verified the picker, search results, close action, responsive header, chart, order book, and order-entry flow in the browser with no console errors.

final result: passed

---

# Perpetual Trading Workspace Design QA — 2026-09-29

Source references:

- `/Users/saadrahman/Desktop/Screenshot 2026-09-29 at 3.33.36 PM.png` — compact order book hierarchy and market-depth treatment.
- `/Users/saadrahman/Desktop/Screenshot 2026-09-29 at 3.39.15 PM.png` — dense TradingView chart controls, candle history, moving average, and volume.
- `/Users/saadrahman/Desktop/Screenshot 2026-09-29 at 4.13.57 PM.png` — token identity and top-line market metrics.
- `/Users/saadrahman/Downloads/Screenshot 2026-09-29 at 3.56.01 PM.png` — mark price, funding, open interest, and volume information architecture.

Viewport: 1440 x 1000 CSS px, device scale factor 1. Route: `/app/trade/?farm=demo-0`. State: ETH/USDC selected, chart and Order book active, simulated market feed.

## Findings and resolved differences

- No remaining P0, P1, or P2 issues.
- Header hierarchy: the pair identity leads a single dense strip followed by Market price, 24h change, 24h volume, Open interest, and Funding / countdown. The order ticket begins on the same top edge.
- Chart density: the implementation uses the TradingView Lightweight Charts library with 72 candles, crosshair inspection, volume, MA9, seven timeframes, price and time scales, plus functional Chart, Overview, and Data views.
- Order book: the default view shows eight price levels around the mark price. Order Book and Recent Trades are functional tabs; the kebab menu switches among Buy & sell, Buy only, and Sell only.
- Visual language: the source information density is retained while controls, positive states, borders, and chart accents use Dexponent's restrained indigo and mint system.
- Copy: all generated data remains visibly labeled Demo or Simulated. Funding interval and countdown are explicit.
- Responsive layout: desktop uses a 2/7/3 market-chart-ticket grid. Narrow layouts stack the modules and preserve chart, order book, and order entry access.
- Intentional product differences: Bybit's drawing toolbar and in-chart buy/sell overlay are excluded because this workspace already has a dedicated order ticket and does not expose drawing persistence. These omissions reduce duplication without removing requested market data.

## Interaction and runtime verification

- Chart, Overview, and Data tabs render their respective views.
- Timeframe controls update the chart interval label and time scale.
- Recent Trades shows eight entries.
- Order book display mode changes through the kebab menu.
- Margin, leverage, account type, size unit, Reduce only, Long/Short, and order-toast behavior remain operational.
- Playwright workspace flow: passed.
- Type check: passed.
- Unit tests: 28 passed.
- Browser visual review: passed at 1440 x 1000 and responsive widths.

final result: passed
