# Dashboard V3 design system

## Design intent

Dashboard V3 is an independent institutional capital workspace for Farm Managers and Liquidity Providers. It prioritizes financial clarity, high information density, progressive disclosure, and fast movement from intent to a valid Farm.

The interface should feel like a modern portfolio operating system. Avoid generic crypto-dashboard decoration, excessive cards, neon surfaces, and low-value metrics.

## Visual tokens

- App background: graphite / near black.
- Primary surfaces: ink and raised graphite.
- Primary action: cool lavender.
- Positive: mint.
- Warning: warm amber.
- Negative: restrained red.
- Text: off-white primary and cool gray secondary.
- Borders: subtle one-pixel neutral hairlines.
- Typography: Outfit with compact but legible financial hierarchy.

Color supports meaning and never replaces a text label.

## Layout

- Fixed `240px` desktop navigation.
- `68px` utility bar.
- Content width up to `1480px` with `28–40px` page gutters.
- Tables for repeatable financial objects.
- Panels only for summaries, focused workflows, charts, or empty states.
- Mobile navigation becomes a dismissible drawer below `960px`.
- Trading may use a compact sidebar to maximize chart and order-entry space.

## Navigation

Primary manager navigation:

- Dashboard
- Managed Farms
- Positions
- Templates
- Analytics / Metrics
- Settings

Profile, wallet, network, notifications, support, company, documentation, social, and legal links belong in established utility menus. Avoid duplicate destinations.

## Core components

### Buttons

- Minimum height: `42px`.
- Radius: `10px`.
- One obvious primary action per screen.
- Destructive actions require clear wording and confirmation.
- Hover, focus, disabled, loading, success, and error states are required.

### Inputs and selects

- Minimum height: `44px`.
- Persistent visible labels.
- Full interactive selection area.
- Clear focus, chosen, helper, and error states.
- Dropdowns must not overlap adjacent controls or content.

### Panels

- Radius: `14px`.
- One-pixel border.
- No decorative glass effects.
- Use spacing, typography, and dividers before adding a container.

### Tables

- Use tables for Farms, Positions, transactions, LPs, and orders.
- Keep labels concise and domain-specific.
- Support search, filtering, sorting, pagination, and useful empty states where appropriate.
- Transaction rows may include hash, LP wallet, type, amount, asset, status, date/time, and failure details.

### Charts

- State whether values are Demo, Simulated, Historical, or Actual.
- Hover reveals exact time and value.
- Time-range controls remain compact.
- Chart color and typography follow V3, including TradingView-based charts.

### Status

- Always include text.
- Use Active, Draft, Deploying, Paused, Degraded, or Retired consistently.
- Do not communicate state through color alone.

## Farm creation

North star: minimize time to the first valid Farm while preserving the established V3 sequence.

1. Strategy and template.
2. Essential configuration and Farm identity.
3. Risk and fees.
4. Review.
5. Simulation.
6. Demo deployment.

Templates supply smart defaults. Advanced parameters use progressive disclosure. Logo and document uploads show previews and validation.

The review screen resembles the final Farm profile and distinguishes estimated, simulated, historical, and actual information.

## Farm workspace

The workspace should answer:

- What is the Farm doing?
- How is it performing?
- Is it within risk limits?
- What has the manager changed?
- What are LPs depositing or withdrawing?
- What action requires attention?

Prefer a small set of useful tabs:

- Overview
- Positions
- Strategy
- Documents
- Transactions / Activity

Avoid repeating template explanations. Strategy flow belongs where it helps a decision.

### Strategy-specific controls

- **Index:** current versus target allocation, drift, rebalance preview, execution impact, and confirmation.
- **Spot:** protocol allocation, asset composition, yield source, swap, and buy/sell.
- **Perpetual:** market pair, venue, margin, leverage, funding, liquidation buffer, trading link, order review, and filled orders.

## Positions and portfolio language

- Navigation label is **Positions**.
- Position views show Farm, strategy, base asset, deposited capital, current value, PnL, status, and actions.
- Portfolio may summarize combined Positions.
- Do not create a duplicate Portfolio product object.

## Motion

- Use short `150–250ms` state transitions and restrained metric animation.
- Animate charts and numbers only when it aids comprehension.
- Avoid bouncing controls, continuous decoration, and slow modal transitions.
- Respect `prefers-reduced-motion`.

## Responsive behavior

Support `1440`, `1280`, `1024`, `768`, `390`, and `375`.

- Desktop prioritizes density and side-by-side comparison.
- Tablet reduces secondary columns and may stack operational panels.
- Mobile prioritizes status, key metrics, primary action, performance, and transaction state.
- Tables may scroll within their labeled region, but the page must not overflow horizontally.

## Accessibility

- Use semantic navigation, headings, forms, dialogs, tabs, and tables.
- Provide visible keyboard focus.
- Label every icon-only action.
- Return focus to the trigger when a dialog closes.
- Never rely on color alone for financial status.
- Maintain contrast across graphite, lavender, mint, amber, and red states.

## Data and security

- Keep V3 state under `dexponent:dbv3:*`.
- Validate configuration before progression or deployment.
- Never request or store private keys or seed phrases.
- Never bypass wallet confirmation.
- Never label a demo action as a successful onchain transaction.
- Keep adapters replaceable so verified APIs and contracts can replace demo data.

## Route families

- Dashboard: `/dbv3/dashboard`
- Explore: `/dbv3/explore`
- Managed Farms: `/dbv3/farms`
- Create Farm: `/dbv3/farms/create`
- Farm workspace: `/dbv3/farms/manage?farm=[id]`
- Positions: `/dbv3/positions`
- Templates: `/dbv3/templates`
- Analytics: `/dbv3/analytics`
- Notifications: `/dbv3/notifications`
- Settings: `/dbv3/settings`

All routes must work with the project's static-export configuration.
