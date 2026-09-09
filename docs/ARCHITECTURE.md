# Architecture

Next.js App Router + TypeScript, React, Lucide, locally packaged Inter, CSS design tokens, and Zod. Native controls and dialogs provide accessible primitives without a large UI dependency. No server data fetching currently exists, so Query and a backend are deferred; a shared field renderer handles the compact schema-driven form.

`src/domain`: models, template registry, validation and deterministic hypothetical simulation.
`src/adapters`: local demo persistence and deployment boundary.
`src/components`: shared presentation, app context, workspace, creation wizard.
`src/app`: route entrypoints and global design tokens.

Routes are handled through an App Router catch-all under `/app`, with a route-aware workspace renderer. Landing/login/signup have explicit pages. Unknown routes show a recovery state. Browser-only state is loaded after hydration, validated, and saved with error reporting. No secrets or private keys are stored.

Next production work: backend identity and team authorization, database migrations, historical data/indexer adapters, wallet library integration across providers, audited contract factories and chain-specific execution, production telemetry and security review.
