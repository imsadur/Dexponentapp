# Landing V3 design system

## Design intent

Landing V3 presents Dexponent as the operating layer for transparent onchain managed capital. It combines premium financial restraint, crypto-native infrastructure visuals, meaningful market data, and direct paths for both Liquidity Providers and Farm Managers.

The page uses dark mode only. It should feel technical, credible, editorial, and interactive without becoming a neon crypto dashboard, a card-heavy SaaS template, or a decorative WebGL experiment.

## Product narrative

The Home page follows this sequence:

1. **Category** — Capital, managed onchain.
2. **Capital-flow proof** — LP capital passes through Dexponent into Index, Spot, and Perpetual strategies.
3. **Protocol snapshot** — clearly labeled illustrative metrics.
4. **The shift** — fragmented DeFi activity becomes one transparent operating model.
5. **Strategy marketplace** — useful Farm data, filters, return sources, capacity, and risk.
6. **Yield education** — explain the return before the APY.
7. **Two-sided product** — separate LP and Farm Manager experiences.
8. **Farm creation** — one connected path from strategy type to operation.
9. **Dexponent system** — one operating model, transparent capital, manager infrastructure, and decision-ready LP context.
10. **Onchain activity** — manager and LP actions remain attributable.
11. **Networks and security** — current support, controls, and audit links.
12. **Why now** — asset management is becoming programmable.
13. **Manager invitation** — turn a strategy thesis into an allocatable product.
14. **Closing action** — explore strategies or launch a Farm.

Avoid repeated headline-and-three-card layouts. Use connected diagrams, dense editorial rows, pinned explanation, interactive product modules, horizontal process flows, and full-width transitions.

## Visual tokens

### Color

- Primary background: `#030706`
- Secondary background: `#050A08`
- Primary surface: `#0A110E`
- Elevated surface: `#0D1512`
- Primary green: `#00E89A`
- Green hover: `#26F1AC`
- Primary text: `#F4F7F5`
- Secondary text: `#8F9A94`
- Supporting text: `#C2CBC6`
- Border: `rgba(255,255,255,0.09)`
- Strong border: `rgba(255,255,255,0.16)`

Use green for primary actions, selected states, capital paths, positive metrics, and restrained atmospheric lighting. Keep most of the interface near-black, charcoal, off-white, and muted gray. Do not wash entire sections in green or layer excessive gradients.

### Typography

- Primary family: Outfit.
- Hero: `64–108px` desktop with very tight tracking and a maximum of three lines.
- Section headline: `46–78px` desktop.
- Product headline: `30–44px`.
- Body: `16–19px` for narrative copy.
- Interface copy: `10–14px`.
- Eyebrow: uppercase `11px`, wide tracking.

Headlines are short and editorial. Paragraphs explain one product idea at a time. Financial labels remain compact and precise.

### Layout

- Navigation and hero maximum width: `1440px`.
- Narrative sections: `1400px` maximum.
- Desktop gutters: `24px` minimum.
- Desktop chapter spacing: approximately `170px`.
- Mobile chapter spacing: approximately `110px`.
- Corners: `8–22px`, used on interactive surfaces rather than every content block.
- Use one-pixel hairlines to structure dense financial information.

## Core components

### Navigation

- Floating and sticky with a translucent near-black background.
- Brand left, narrative anchors centered, LP and manager actions right.
- Primary action: Launch a Farm.
- Secondary action: Explore strategies.
- Mobile uses a compact button and a full-width menu below `800px`.

### Hero and capital-flow visual

- Artistic asymmetric layout: editorial copy left and an interactive infrastructure diagram right.
- Headline: “Capital, managed onchain.”
- LP action: Explore strategies.
- Manager action: Launch a Farm.
- The diagram shows LP capital entering the Dexponent engine and routing into Index, Spot, and Perpetual strategies.
- SVG capital paths animate continuously and react with restrained cursor lighting.
- Label the routing visual illustrative.
- Use SVG and CSS instead of WebGL to preserve performance and mobile clarity.

### Protocol strip

- Full-width moving statistics row directly below the hero.
- Values are structured demo data and explicitly labeled “Demo network snapshot” or “Illustrative.”
- Do not present fabricated values as live protocol figures.

### Strategy marketplace

- Structured Farm objects power both the focus visualization and dense list.
- Filters: All, Index, Spot, Perpetual.
- Required information: Farm, manager, return source, network, estimated APY, demo TVL, capacity, risk, LP count, and illustrative performance history.
- Hover or keyboard focus updates the featured Farm.
- Real token and network marks remain visible.

### Yield mechanisms

- Use semantic tabs for Index, Spot, and Perpetual.
- Index: `Capital → Portfolio allocation → Rules-based rebalance → Portfolio return`.
- Spot: `Capital → Lending or LP → Yield and fees → Compounding`.
- Perpetual: `Collateral → Market position → Hedge → Funding and P&L`.
- Each state explains return source, risk source, liquidity, and networks.
- Keep the narrative heading pinned on wide screens while the product explanation scrolls.

### LP and manager switch

- One visible semantic tab switch controls the audience story.
- LP view prioritizes discovery, risk, positions, liquidity, and manager activity.
- Manager view prioritizes configuration, risk controls, exposure, LP flows, and rebalancing.
- Each state uses realistic product UI rather than a generic screenshot.

### Farm creation

Connect five steps in one continuous visual flow:

1. Choose a strategy type.
2. Configure capital rules.
3. Set risk and fees.
4. Deploy onchain.
5. Accept LP capital and operate.

The flow becomes a horizontal carousel on narrow screens.

### Activity, networks, and trust

- Activity rows show action, value, block, timestamp, network, and transaction fragment.
- Network visuals use actual Base, Ethereum, and Arbitrum assets.
- Base is identified as the current beta network; other networks use accurate demo-support language.
- Security includes non-custodial architecture, permissions, transaction visibility, Farm risk controls, and the Hacken audit link.
- Preserve a visible risk statement.

### Footer

- Include Product, Managers, Resources, and Legal destinations.
- Include documentation, audits, beta guide, privacy, terms, and risk disclosure.
- State that V3 financial figures are demo or illustrative.

## Interaction and motion

- GSAP reveals hero and chapter content with short opacity and vertical movement.
- A scrubbed text reveal introduces the fragmented-to-unified problem statement.
- The yield explanation pins on desktop.
- Hovering strategy rows updates the featured strategy without delayed animation.
- Capital paths use lightweight SVG animation.
- Buttons move no more than two pixels on hover.
- Avoid bouncing, spinning decoration, random particles, long loaders, or motion that blocks reading.
- Under `prefers-reduced-motion`, animations and transitions collapse to near-zero duration.

## Responsive behavior

Support `1440`, `1280`, `1024`, `768`, `390`, and `375`.

- Below `1180px`, stack the hero, marketplace focus, yield explanation, audience view, system section, and manager invitation.
- Below `800px`, use mobile navigation, stacked financial layouts, reduced table columns, and a horizontal Farm-creation sequence.
- Below `430px`, make hero actions full width and tighten diagrams without hiding the product meaning.
- Complex network and infrastructure diagrams simplify vertically on mobile.
- Never allow horizontal page scrolling.

## Accessibility

- Keep semantic landmarks and a valid heading hierarchy.
- Filters and audience controls use tab roles with `aria-selected`.
- Icon-only controls need accessible names.
- Focus states use the primary green and remain visible against dark surfaces.
- Color supplements labels and does not carry meaning alone.
- Token and network graphics are decorative when adjacent text identifies them.
- Maintain strong contrast for all body copy and actions.

## Performance

- Prefer CSS and SVG to heavy 3D rendering.
- Avoid video and large hero bitmaps.
- Keep graphic dimensions stable to prevent layout shift.
- Reuse the local logo and network assets.
- Structure below-fold content so heavier visual modules can be lazy-loaded later.
- Target smooth desktop motion and simplified mobile effects.

## Data architecture

V3 demo Farms use structured objects with:

`id`, `name`, `type`, `manager`, `source`, `pair`, `apy`, `tvl`, `network`, `risk`, `capacity`, `lpCount`, `status`, `assets`, and `history`.

Activity and yield-mechanism content also use structured data. Keep data replaceable by a future adapter and avoid scattering strategy metrics through markup. Values remain estimated, demo, or illustrative until backed by verified APIs.

## Routing

- `/landingv3/home`
- `/landingv3/yield`
- `/landingv3/farms`
- `/landingv3/farm-details/[farm-id]`
- `/landingv3/networks`
- `/dbv3/*` for application handoff
