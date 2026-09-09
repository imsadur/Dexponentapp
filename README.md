# Dexponent

A functional DeFi strategy workspace prototype built from the provided requirement PDF and farm creation wireframe.

## Run locally

Requires Node.js 20.9+ (tested on Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the landing page or http://localhost:3000/app/dashboard for the workspace.

## Included

- Index, Spot and Perpetual strategy families, 19 templates.
- Six-step creation flow with schema-driven parameters, validation and live strategy flow.
- Autosaved local drafts, resume, configuration export and deployment preview.
- Overview, farm management/detail, template library, analytics and settings.
- Dark/light modes, mobile layout, keyboard controls and native confirmation dialogs.
- Browser wallet public-account connection, missing-wallet/rejection handling, account/chain event handling.
- Deterministic hypothetical scenarios and explicitly labeled demo fixtures.

## Boundaries

Login is demo access, not server authentication. All portfolio data is illustrative. Simulation is synthetic, not a historical backtest. Preview completion saves a READY local strategy; it never submits a blockchain transaction or creates a fake transaction hash. Live contracts, audited protocol integration, backend identity/team access, historical data and production monitoring are future work. Settings and drafts stay in this browser; export JSON to keep a portable copy.

## Validation

```bash
npm run typecheck
npm test
npm run build
# With the dev server running and Google Chrome installed:
npm run test:e2e
```

The Playwright configuration uses local Chrome. Change `channel: 'chrome'` or install Playwright Chromium if necessary.

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Strategy engine](docs/STRATEGY_ENGINE.md)
- [Deployment boundary](docs/DEPLOYMENT.md)
- [Research and official sources](docs/research/web3-defi-product-research.md)
- [UX principles](docs/research/ux-principles.md)

Original supplied documents are in `references/` and are not bundled into the app.
