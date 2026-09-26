# Dashboard V3 agent instructions

## Ownership and isolation

- This directory owns the independent Dashboard/App V3 product.
- Keep every authenticated V3 destination under `/dbv3/*`.
- Do not import V1/V2 components, route helpers, providers, data adapters, or styles.
- Store demo state only under the `dexponent:dbv3:*` namespace.
- Landing V3 may link into DBv3. DBv3 must never redirect into `/app/*`.
- Preserve Dashboard V2 while changing V3.

## Product model

- **Farm** is the primary managed product.
- **Strategy** describes how a Farm deploys capital.
- **Position** is the LP's exposure and history within a Farm.
- **Managed Farms** are Farms operated by the current manager.
- **Portfolio** describes the LP's combined Positions and must not replace the navigation label Positions.
- **DTF** may describe the underlying fund structure in documentation. Explain its relationship to a Farm before using it in product UI.

V3 supports exactly three primary strategy systems:

- **Index** — multi-asset allocation and rules-based rebalancing.
- **Spot** — lending, liquidity, and compounding.
- **Perpetual** — directional, hedged, funding, or basis strategies with explicit margin and liquidation controls.

## Product roles

### Farm Managers

Managers create, configure, review, deploy, operate, rebalance, and monitor Farms. They review LP capital flows, Positions, risk, liquidity, performance, fees, documents, and activity.

### Liquidity Providers

LPs discover Farms, compare return sources and risk, review manager and strategy information, make demo deposits, track Positions, and submit demo withdrawals.

## Financial and demo-data rules

- Label every number **Demo**, **Illustrative**, **Estimated**, **Simulated**, **Historical**, or **Actual**.
- Never imply that local state is an onchain transaction.
- Never fabricate transaction confirmation, contract addresses, audits, or live performance.
- Demo actions explain what changes locally and what would require a wallet or contract.
- APY, manager fees, LP yield, PnL, deposits, withdrawals, and TVL remain logically distinct.

## Implementation rules

- Follow [`design.md`](./design.md).
- Reuse existing DBv3 components and structured data before creating duplicates.
- Use Phosphor Icons for interface icons.
- Use real token and network brand assets for financial symbols.
- Use semantic HTML, accessible labels, visible focus, and text-supported status states.
- Consequential demo actions require review or confirmation.
- Loading, success, empty, error, and retry states are required for primary workflows.

## Required lifecycle verification

Verify the complete isolated V3 path:

1. Landing V3 → Explore Farms → Farm profile → DBv3 Farm workspace.
2. Landing V3 → Launch a Farm → DBv3 builder.
3. Choose Index, Spot, or Perpetual.
4. Select a template.
5. Configure Farm identity and strategy fields.
6. Review risk and economics.
7. Confirm demo deployment.
8. Find the deployed Farm in Managed Farms.
9. Open its workspace.
10. Test eligible deposit, withdrawal, pause, rebalance, and trading actions.
11. Confirm Positions and activity update.
12. Confirm no V3 route navigates to `/app/*`.

After meaningful changes:

- Verify navigation, filters, search, tables, dialogs, and empty states.
- Verify desktop and mobile layouts.
- Recheck Landing V3 handoffs and Dashboard V2 routes.
- Run type checking, unit tests, relevant end-to-end tests, and the production build.
- Check local and deployed browser consoles.
