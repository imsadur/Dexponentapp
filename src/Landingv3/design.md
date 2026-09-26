# Landing V3 design system

## Design intent

Landing V3 is a warm editorial interpretation of Dexponent. It combines an institutional financial tone with a clear public explanation of the product. It should feel credible, data-aware, and product-led without resembling a generic crypto dashboard.

Landing V3 is intentionally distinct from the future dark green cinematic direction described for Landing V4. Preserve this identity for version comparison.

## Product narrative

The Home page follows this order:

1. **Category and value** — launch, raise, and run onchain funds.
2. **Interactive product proof** — switch among Perpetual, Index, and Spot demo Farms.
3. **Illustrative snapshot** — clearly labeled demo capital, positions, Farms, and networks.
4. **Opportunity set** — compare strategy, network, APY, TVL, and risk.
5. **Strategy systems** — explain where each return comes from.
6. **Operating model** — choose a strategy, set guardrails, and operate with context.
7. **Two-sided value** — separate LP and Farm Manager journeys.
8. **Final action** — explore Farms or launch one.

Avoid repeating a headline-and-three-cards pattern. Use full-width transitions, editorial rows, interactive product modules, sticky explanation, and paired audience blocks.

## Visual tokens

### Color

- Paper background: `#F4F1E8`
- Strong paper surface: `#FBFAF5`
- Primary ink: `#10192C`
- Secondary text: `#626A78`
- Cobalt action: `#3158ED`
- Cobalt hover: `#2444C2`
- Acid-lime proof accent: `#C7FF57`
- Positive green: `#128258`
- Hairline border: `#C9C9C3`

Use cobalt for primary actions and selection. Use lime for proof points and high-contrast accents. Keep gradients minimal.

### Typography

- Primary family: Outfit.
- Hero: `58–88px` desktop, tight tracking, maximum three lines.
- Section headline: `44–76px` desktop.
- Body: `15–17px` with generous line height.
- Eyebrow: uppercase monospace, `10px`, wide tracking.
- Data labels: `10–12px`.

Headlines are short and editorial. Paragraphs explain one idea at a time.

### Layout

- Main content width: `1320px` maximum.
- Desktop page gutter: `20px` minimum.
- Floating navigation: `68px` minimum height.
- Section spacing: approximately `82–112px`.
- Corners: `10–18px`; avoid making every item a card.
- Borders: one-pixel neutral or dark hairlines.

## Core components

### Navigation

- Floating and sticky.
- Brand left, public destinations centered, app actions right.
- Primary action: Launch a Farm.
- Secondary action: Open dashboard.
- Mobile uses a dismissible menu below `960px`.

### Hero

- Two-column asymmetric desktop layout.
- Headline remains readable in two or three lines.
- LP action: Explore demo Farms.
- Manager action: Create a Farm.
- Trust notes state that the experience is a demo, requires no wallet, and exposes risk context.

### Interactive Farm monitor

- Dark market-data surface against the paper hero.
- Tabs for Perpetual, Index, and Spot.
- Shows return source, token path, token logos, chain logo, estimated APY, demo TVL, and risk.
- Uses semantic tab roles and `aria-selected`.
- Updates immediately without motion that delays reading.

### Farm directory

- Use dense editorial rows instead of a generic card grid.
- Required information: Farm, strategy type, return source, network, estimated APY, demo TVL, and risk.
- Risk uses text plus color.
- Row hover may shift only a few pixels.

### Strategy education

- Index: `USDC → allocation → assets → rebalance`.
- Spot: `USDC → protocol → yield → compound`.
- Perpetual: `USDC → margin → hedge → funding`.
- Explain mechanics and risk before directing users to Farms.

### LP and manager journeys

- LP: Understand → Compare → Decide.
- Manager: Create → Deploy → Operate.
- Each journey names concrete capabilities and links to a real V3 destination.

### Footer

- Dark full-width conclusion.
- Include Explore, Product, and Company columns.
- Include documentation and legal links.
- State that V3 figures are illustrative.

## Interaction and motion

- Use `150–250ms` state transitions.
- Favor tab transitions, link underlines, slight row movement, and button elevation.
- Avoid bouncing, meaningless particles, long loaders, and continuous motion behind text.
- Disable non-essential transitions under `prefers-reduced-motion`.

## Responsive behavior

Support `1440`, `1280`, `1024`, `768`, `390`, and `375`.

- Below `1080px`, simplify Farm directory columns.
- Below `960px`, stack the hero and use mobile navigation.
- Below `680px`, stack actions, trust notes, strategy modules, audience panels, and footer groups.
- Hide secondary table fields only when Farm, strategy, APY, and destination remain clear.
- Do not allow horizontal page scrolling.

## Accessibility

- Use semantic landmarks and heading order.
- Interactive previews use buttons or links, visible focus, and accessible names.
- Color supplements labels and never carries meaning alone.
- Token and network marks are decorative when adjacent text identifies them.
- Maintain contrast on paper, cobalt, and dark sections.

## Performance

- Prefer CSS and SVG-style visuals to heavy WebGL in V3.
- Avoid large video or bitmap hero assets.
- Keep layout dimensions stable.
- Lazy-load future below-fold media.
- A WebGL capital-flow narrative belongs in Landing V4 and requires a lightweight fallback.

## Data architecture

V3 demo Farms use structured objects with:

`id`, `name`, `type`, `source`, `pair`, `apy`, `tvl`, `network`, `risk`, and `assets`.

Keep data replaceable by a future adapter. Do not scatter Farm metrics through page markup. Public values remain estimated or demo until backed by a verified API.

## Routing

- `/landingv3/home`
- `/landingv3/yield`
- `/landingv3/farms`
- `/landingv3/farm-details/[farm-id]`
- `/landingv3/networks`
- `/dbv3/*` for product handoff
