# Landing V3 agent instructions

## Ownership and version boundary

- This directory owns the independent public **Landing V3** experience.
- Preserve Landing V1 and V2. Do not import their components or styles into V3.
- Keep public V3 destinations under `/landingv3/*` and application handoffs under `/dbv3/*`.
- V3 uses the dark, green, cinematic marketing system documented in `design.md`. Keep that visual and narrative system coherent across all `/landingv3/*` routes.
- V3 must stay available from the page-version index for comparison.

## Product purpose

Landing V3 explains Dexponent as a two-sided system for transparent onchain managed capital:

- **Farm Managers** create, deploy, and operate Index, Spot, and Perpetual Farms.
- **Liquidity Providers** discover Farms, understand return sources and risk, review activity, and track Positions.
- A **strategy** is the investment logic.
- A **Farm** is the managed product containing the strategy, controls, manager context, liquidity, documents, performance, and activity.
- A **Position** is an LP's balance and history within a Farm.
- If DTF terminology appears, explain that a Farm is the current product-facing name for the managed DTF experience. Do not alternate terms without explanation.

Within ten seconds the visitor should understand what Dexponent is, what each audience can do, how the three strategy systems differ, and where to start.

## Source of truth

- Follow [`design.md`](./design.md) for visual, content, interaction, responsive, and accessibility decisions.
- Reuse V3 Farm definitions and application routes instead of inventing conflicting data.
- Use the Dexponent mark in `/public/brand/dexponent-mark.svg`.
- Use real token assets from `@web3icons/react` and chain assets from `/public/brand/chains`.
- Use Phosphor Icons for interface actions and concepts.
- Never replace token, protocol, network, or product marks with generic icons.

## Content and financial language

- Label every public financial figure **Demo**, **Illustrative**, **Estimated**, **Simulated**, **Historical**, or **Actual**.
- Never present mock TVL, APY, activity, or performance as live protocol data.
- Explain the return source before emphasizing APY.
- Explain why a Farm is Low, Moderate, or High risk.
- Avoid guaranteed-return language, vague institutional claims, and generic crypto slogans.
- Prefer short editorial headlines and concrete product copy.

## Page and interaction rules

- Preserve the CTA hierarchy: **Explore strategies** for LPs and **Launch a Farm** for managers.
- Strategy filters, yield-mechanism tabs, and the LP/manager switch must be keyboard accessible and expose selected-tab state.
- Farm rows link to the corresponding public Farm profile.
- Farm profiles hand off to the matching `/dbv3/farms/manage` workspace.
- Mobile navigation must close, support keyboards, and avoid horizontal overflow.
- External company, documentation, privacy, and terms destinations use safe new-tab attributes.
- Motion must clarify hierarchy or state and respect `prefers-reduced-motion`.

## Routing

- Home: `/landingv3/home`
- Yield education: `/landingv3/yield`
- Farm directory: `/landingv3/farms`
- Farm profile: `/landingv3/farm-details/[farm-id]`
- Networks: `/landingv3/networks`
- Application handoff: `/dbv3/*`

All routes must work with static export and trailing slashes.

## Required verification

Before completing a Landing V3 change:

1. Verify Home, Yield, Farms, each Farm profile, and Networks.
2. Test the strategy filters, Index/Spot/Perpetual yield tabs, and LP/manager switch.
3. Follow Home → Farms → Farm profile → V3 workspace.
4. Follow Home → Launch a Farm → V3 builder.
5. Verify desktop and mobile layouts without horizontal overflow.
6. Check keyboard focus, heading order, labels, and contrast.
7. Confirm Landing V1/V2 and Dashboard V2 remain unchanged.
8. Run type checking, unit tests, relevant end-to-end tests, and the production build.
9. Check local and deployed browser consoles.
