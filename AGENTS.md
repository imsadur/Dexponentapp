<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CRITICAL AGENT EXECUTION RULE

## DO IT YOURSELF — DO NOT DELEGATE ACTIONS TO THE USER

Whatever action you can do yourself, **PLEASE DO IT YOURSELF**.

Do not unnecessarily ask the user to perform actions that you can perform through the available terminal, filesystem, browser, development environment, or other available tools.

This rule applies to the entire project.

The agent should independently:

* Inspect the repository
* Inspect existing files and architecture
* Read relevant documentation
* Create files
* Modify files
* Refactor code
* Install dependencies when appropriate
* Run development servers
* Start applications
* Run builds
* Run lint
* Run type checks
* Run tests
* Inspect routes
* Verify pages
* Verify user flows
* Check browser/application output
* Check console errors
* Check runtime errors
* Fix errors discovered during verification
* Restart applications when required
* Re-run failed checks
* Review the final implementation
* Verify that features actually work
* Verify responsive behavior where tooling allows
* Verify the final UI instead of assuming it works

### BAD

> Run npm install and then start the application.

### GOOD

> Install the required dependencies, start the application, verify the relevant route, test the feature, fix any issues, and re-run verification.

### NEVER STOP AT "CODE WRITTEN"

Writing code is not the same as completing the task.

Whenever technically possible, the agent MUST:

1. Inspect the existing implementation.
2. Implement the requested change.
3. Start the application itself.
4. Open/verify the relevant route.
5. Test the primary user journey.
6. Check runtime and console errors.
7. Run type checking.
8. Run lint.
9. Run tests when available.
10. Run production build when appropriate.
11. Fix issues discovered.
12. Re-run verification.
13. Only then report the task as complete.

If an action genuinely requires a human decision, credential, wallet signature, external permission, or unavailable service, clearly state the exact blocker instead of pretending the task is complete.

---

<!-- BEGIN:nextjs-agent-rules -->

**# This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 1. PROJECT

This project is a professional Web3 / DeFi platform for creating, launching, managing, and exploring investment Farms.

The product should feel closer to a modern institutional financial platform combined with the simplicity of a modern SaaS product.

It must NOT feel like a generic crypto dashboard.

Primary product goal:

> Make creating, understanding, launching, and managing a DeFi Farm extremely simple while maintaining professional-grade transparency, risk visibility, and controls.

# 2. PRODUCT PRINCIPLES

Always optimize for:

* Simplicity
* Speed
* Trust
* Transparency
* Safety
* Discoverability
* Professionalism
* Clear financial information
* Progressive disclosure
* Excellent UX
* Strong visual hierarchy
* Minimal cognitive load

The primary north-star UX principle is:

> Optimize for "time to first valid Farm."

Creating a Farm should feel more like creating a modern SaaS project than configuring a blockchain contract.

# 3. PRIMARY USERS

The product has two major user groups.

## Farm Managers

Farm Managers can:

* Create Farms
* Configure strategies
* Upload Farm branding
* Add Farm information
* Upload supporting documents
* Simulate strategies
* Deploy Farms
* Manage Farms
* Pause Farms
* Archive Farms
* Rebalance strategies
* Monitor performance
* Manage liquidity
* Monitor LPs
* Review deposits
* Review withdrawals
* Analyze performance
* Manage risk
* Update Farm information

## Liquidity Providers / LPs

LPs can:

* Explore Farms
* Search Farms
* Filter Farms
* Compare Farms
* Understand strategies
* Review performance
* Review risk
* Review Farm Manager information
* Read supporting documents
* Deposit capital
* Withdraw capital
* Track portfolio performance
* Monitor Farm activity

# 4. CORE PRODUCT OBJECT

The primary user-facing object should be:

> FARM

Avoid forcing users to think in terms of low-level "Strategy" objects.

A Farm contains:

* Farm identity
* Farm logo
* Farm name
* Short description
* Long description
* Strategy type
* Strategy configuration
* Assets
* Protocols
* Risk profile
* Performance
* TVL
* LPs
* Liquidity
* Manager
* Documents
* Activity
* Deployment status
* Contract information

# 5. THREE PRIMARY STRATEGY TYPES

The product supports exactly three primary strategy categories.

## 5.1 INDEX

Index strategies allocate capital across multiple assets.

Example:

USDC
↓
Allocation
↓
BTC / ETH / SOL
↓
Rebalance

Typical parameters:

* Assets
* Allocation percentages
* Rebalance frequency
* Maximum allocation
* Minimum allocation
* Base asset
* Rebalance threshold
* Risk controls

## 5.2 SPOT

Spot strategies deploy capital into spot-based DeFi opportunities.

Example:

USDC
↓
Aave
↓
Lending
↓
Yield
↓
Compound

Typical parameters:

* Asset
* Protocol
* Pool
* Allocation
* Yield source
* Compounding
* Harvest frequency
* Risk limits

## 5.3 PERPETUAL

Perpetual strategies use perpetual markets for hedging, yield, or directional strategies.

Example:

USDC
↓
Margin
↓
ETH PERP
↓
Hedge
↓
Funding Capture

Typical parameters:

* Market
* Asset
* Long/short
* Leverage
* Margin
* Position size
* Hedge ratio
* Funding strategy
* Liquidation buffer
* Maximum exposure

# 6. FARM CREATION UX

Farm creation must be extremely simple.

Primary flow:

Create Farm
→ Choose Strategy Type
→ Choose Template
→ Add Farm Details
→ Configure Strategy
→ Preview
→ Review
→ Publish / Deploy

Do NOT expose every advanced blockchain parameter immediately.

Use progressive disclosure.

The creation flow should have approximately four main conceptual steps:

1. Strategy Type
2. Template
3. Farm Details + Configuration
4. Review + Deploy

# 7. STRATEGY TYPE SELECTION

The first screen should clearly present:

### Index

Diversified multi-asset allocation.

### Spot

Yield opportunities from spot DeFi markets.

### Perpetual

Perpetual-market strategies, hedging, and funding opportunities.

Each option should include:

* Simple explanation
* Example use case
* Risk level
* Typical assets
* Example strategy flow

Do not overwhelm users with technical terminology.

# 8. FARM TEMPLATES

Templates should preconfigure approximately 70–80% of the strategy.

Example templates:

### Index

* Blue Chip Index
* Large Cap DeFi Index
* Balanced Crypto Index
* Stablecoin Index

### Spot

* Stablecoin Yield
* Lending Optimizer
* Liquidity Yield
* Conservative Yield

### Perpetual

* Delta Neutral
* Funding Capture
* Market Neutral
* Hedged Yield

# 9. INTELLIGENT FARM BUILDER

The builder should be schema-driven.

The UI should dynamically render configuration fields based on:

* Strategy type
* Template
* Selected assets
* Protocol
* Risk level

The same overall builder structure should be reused across Index, Spot, and Perpetual.

Do not create three completely separate UX systems unless technically necessary.

# 10. FARM BUILDER LAYOUT

Preferred desktop layout:

### LEFT

Configuration controls.

### CENTER

Live Strategy Flow visualization.

### RIGHT

Live Farm Summary.

Example:

LEFT:
Assets
Allocation
Risk
Rebalance

CENTER:
USDC → BTC/ETH/SOL → Allocation → Rebalance

RIGHT:
TVL
Risk
Expected APY
Allocation
Strategy status

# 11. STRATEGY FLOW VISUALIZER

Every strategy should have a simple visual representation.

Examples:

Index:

USDC → Allocation → BTC / ETH / SOL → Rebalance

Spot:

USDC → Aave → Lending → Yield → Compound

Perpetual:

USDC → Margin → ETH PERP → Hedge → Funding Capture

The visualizer should update live when configuration changes.

# 12. FARM IDENTITY

Farm creation should allow:

* Logo upload
* Farm name
* Short description
* Long description
* Category
* Strategy type
* Tags
* Manager profile
* Website
* Social links

Logo upload should support common image formats.

Show image preview before publishing.

# 13. FARM DOCUMENTS

Documents are first-class Farm content.

Farm Managers should be able to upload:

* PDF
* PPT
* PPTX
* DOC
* DOCX
* XLS
* XLSX
* CSV
* Images
* Strategy documents
* Audit reports
* Backtest reports
* Risk methodology
* Pitch decks
* Terms
* Disclosures

LPs should be able to:

* View document name
* View document type
* View document size
* Preview supported documents
* Download documents where permitted

Documents must be visible from the LP-facing Farm Profile.

Potential future feature:

AI-generated document summaries.

# 14. FARM REVIEW SCREEN

Before deployment, the Review screen should resemble the final LP-facing Farm Profile.

Show:

* Farm logo
* Farm name
* Description
* Strategy type
* Strategy flow
* Assets
* Risk
* Expected APY
* Performance assumptions
* Manager
* Documents
* Fees
* Liquidity settings
* Important warnings

Primary action:

> Publish Farm

or:

> Deploy Farm

Clearly distinguish:

* Estimated
* Simulated
* Historical
* Actual

Never present simulated or estimated performance as guaranteed.

# 15. FARM MANAGER DASHBOARD

Primary navigation:

* Overview
* Farms
* LPs
* Analytics
* Templates
* Settings

Primary CTA:

> * Create Farm

# 16. FARMS LIST

Prefer a high-density professional table/list instead of excessive cards.

Columns can include:

* Farm
* Strategy
* TVL
* APY
* Performance
* Risk
* LPs
* Status
* Last rebalance
* Actions

Provide:

* Search
* Filters
* Sorting
* Status filters
* Strategy filters
* Risk filters

Avoid unnecessary visual clutter.

# 17. FARM DETAIL WORKSPACE

Farm detail should include:

* Overview
* Performance
* Strategy
* Liquidity
* LPs
* Documents
* Activity
* Settings

Primary actions:

* Manage
* Rebalance
* Pause
* Edit
* Archive
* Withdraw
* View Contract

# 18. FARM LIFECYCLE

Farm states:

* Draft
* Configuring
* Simulation
* Ready
* Deploying
* Active
* Paused
* Degraded
* Retired

Draft Farms:

* Edit
* Delete

Active Farms:

* Pause
* Archive

Avoid destructive "Delete" actions on active financial products.

# 19. PERFORMANCE ANALYTICS

Analytics should answer:

> How is my Farm performing?

Show:

* TVL
* APY
* APR
* PnL
* Revenue
* Fees
* LP capital
* Deposits
* Withdrawals
* Net flows
* Performance attribution

Time ranges:

* 24H
* 7D
* 30D
* 90D
* 1Y
* All Time

Always label the source and type of financial data.

# 20. PERFORMANCE ATTRIBUTION

Where technically possible, explain performance by:

* Asset allocation
* Protocol yield
* Trading
* Funding
* Fees
* Rebalancing
* Market movement

The user should understand WHY performance changed, not only see a number.

# 21. LIQUIDITY MANAGEMENT

Liquidity dashboard should show:

* TVL
* Available liquidity
* Utilized liquidity
* Withdrawal queue
* Deposits
* Withdrawals
* Net flow
* LP activity

Use clear visual indicators for liquidity constraints.

# 22. LP EXPERIENCE

LP journey:

Explore Farms
→ Farm Profile
→ Understand Strategy
→ Review Risk
→ Review Documents
→ Review Performance
→ Review Manager
→ Deposit

The product should optimize for:

> Understand → Trust → Decide → Deposit

# 23. FARM EXPLORER

Farm discovery should support:

* Search
* Strategy type
* Risk
* APY
* TVL
* Network
* Asset
* Manager

Do not make APY the only discovery metric.

Trust signals should include:

* Historical performance
* TVL
* Risk
* Strategy
* Manager
* Audit status
* Documents
* Track record
* Farm age

# 24. LP FARM PROFILE

The LP-facing Farm Profile should include:

### Header

* Logo
* Farm name
* Strategy type
* APY
* TVL
* LP count
* Risk

### Sections

* About
* How It Works
* Performance
* Risk
* Assets
* Strategy
* Documents
* Farm Manager
* Activity

Primary CTA:

> Deposit

# 25. RISK UX

Risk must be understandable.

Avoid showing only technical risk metrics.

Use:

* Low
* Moderate
* High
* Very High

Explain WHY.

Potential risk categories:

* Market risk
* Smart contract risk
* Liquidity risk
* Leverage risk
* Protocol risk
* Oracle risk
* Counterparty risk

Never imply that a risk score means capital is safe.

# 26. TRANSACTION UX

Blockchain transactions should feel simple.

Use:

Review
→ Confirm
→ Wallet
→ Pending
→ Confirmed

Clearly show:

* Transaction type
* Amount
* Network
* Estimated gas
* Slippage where relevant
* Contract
* Status

Never hide transaction state.

# 27. WALLET UX

Support common wallet connection patterns.

The UI should clearly communicate:

* Connected wallet
* Network
* Balance
* Transaction status

Handle:

* Wrong network
* Rejected transaction
* Insufficient balance
* Insufficient gas
* Pending transaction
* Failed transaction
* Contract failure

# 28. MOCK DATA

When backend/blockchain infrastructure is unavailable, use realistic mock data.

Mock data must look believable but MUST NOT be represented as real financial performance.

Use labels such as:

* Demo
* Simulated
* Estimated
* Testnet

Never fabricate real-world financial claims.

# 29. FINANCIAL DATA LANGUAGE

Always distinguish:

### Actual

Verified on-chain or backend data.

### Historical

Previously observed data.

### Estimated

Calculated expectation.

### Simulated

Generated from a model or test environment.

### Projected

Forward-looking model.

Never blur these categories.

# 30. DESIGN SYSTEM

Use a premium institutional DeFi visual language.

Default:

* Dark theme
* Light theme support
* Inter font
* Strong typography
* High information density
* Clean spacing
* Subtle borders
* Minimal gradients
* Controlled animation

Avoid:

* Meme-coin aesthetics
* Excessive neon
* Excessive glassmorphism
* Overuse of gradients
* Giant decorative elements
* Generic crypto dashboard patterns

# 31. UI PRINCIPLES

Every screen should have:

1. Clear hierarchy
2. Clear primary action
3. Clear secondary actions
4. Strong information grouping
5. Predictable interactions
6. Useful empty states
7. Useful loading states
8. Useful error states

Avoid:

* Unnecessary modals
* Excessive cards
* Repeated information
* Decorative UI with no purpose
* Long forms without grouping

# 32. RESPONSIVE DESIGN

Support:

* Desktop
* Tablet
* Mobile

Desktop should prioritize professional data density.

Mobile should prioritize:

* Key metrics
* Primary actions
* Farm status
* Strategy summary
* Performance
* Deposit / Withdraw

# 33. ACCESSIBILITY

Follow accessible UI practices.

Ensure:

* Keyboard navigation
* Visible focus
* Sufficient contrast
* Semantic HTML
* Accessible labels
* Accessible forms
* Screen-reader friendly controls
* No information conveyed only by color

# 34. ERROR HANDLING

Every major action must have:

* Loading state
* Success state
* Error state
* Retry action where possible

Errors should explain:

What happened?

Why?

What can the user do next?

# 35. ROUTING

Expected conceptual routes:

/explore

/farms

/farms/[id]

/farms/create

/farms/[id]/performance

/farms/[id]/strategy

/farms/[id]/liquidity

/farms/[id]/lps

/farms/[id]/documents

/farms/[id]/activity

/farms/[id]/settings

/manager

/manager/farms

/manager/analytics

/manager/lps

/settings

# 36. TECH STACK

Use the project's existing stack unless there is a strong technical reason to change it.

Expected technologies may include:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui or equivalent component system
* EVM/Web3 libraries where required

Do not introduce unnecessary dependencies.

Reuse existing components before creating duplicates.

# 37. NEXT.JS DEVELOPMENT RULE

Before writing Next.js code:

1. Inspect the installed Next.js version.
2. Read the relevant documentation from:

`node_modules/next/dist/docs/`

3. Follow the installed version's APIs and conventions.
4. Do not rely on outdated Next.js knowledge.
5. Respect deprecation warnings.
6. Preserve the auto-generated Next.js agent block in this file.

# 38. CODE QUALITY

Prefer:

* Small reusable components
* Strong TypeScript types
* Clear naming
* Simple state management
* Reusable hooks
* Reusable UI primitives
* Schema-driven configuration
* Separation of concerns

Avoid:

* Giant components
* Duplicate logic
* Hardcoded repeated values
* Unnecessary abstractions
* Dead code
* Unused dependencies

# 39. SECURITY

Treat financial and blockchain functionality as security-sensitive.

Never:

* Expose private keys
* Store seed phrases
* Hardcode credentials
* Bypass wallet confirmations
* Fake transaction success
* Hide transaction failures
* Pretend mock data is live data

Validate user input.

Validate transaction state.

Never assume a transaction succeeded without confirmation.

# 40. RESEARCH RULE

When implementing an unfamiliar Web3/DeFi pattern, research current industry implementations and official documentation before making architectural decisions.

Useful reference categories include:

* DeFi vaults
* Strategy platforms
* Yield aggregators
* Institutional portfolio platforms
* Web3 asset management
* Permissionless fund platforms

Prefer primary sources and official documentation for protocol behavior.

# 41. PRODUCT LANGUAGE

Prefer:

> Create Farm

over:

> Create Strategy

Prefer:

> Farm Manager

over:

> Strategy Operator

Prefer:

> Farm Profile

over:

> Strategy Details

Prefer:

> Deposit

over:

> Invest

when the action specifically represents LP capital entering a Farm.

Use technical terminology only when it helps the user.

# 42. FARM CREATION UX NORTH STAR

The complete experience should feel like:

Intent
→ Strategy Type
→ Template
→ Essential Configuration
→ Live Preview
→ Review
→ Publish
→ Deploy

Not:

Configure 30 blockchain parameters
→ Sign multiple transactions
→ Hope everything works

# 43. PROGRESSIVE DISCLOSURE

Beginner users should see only essential fields.

Advanced users should be able to expand:

> Advanced Settings

Examples:

* Risk limits
* Rebalance thresholds
* Leverage
* Slippage
* Gas settings
* Position limits
* Protocol constraints
* Custom execution rules

Never force advanced users and beginners into the same level of complexity.

# 44. SMART DEFAULTS

Use sensible defaults whenever possible.

Templates should automatically configure:

* Recommended assets
* Allocation
* Risk controls
* Rebalance frequency
* Protocol
* Strategy parameters

The user should only need to change what matters.

# 45. DEVELOPMENT PROCESS

For every meaningful task, follow this process:

### STEP 1 — INSPECT

Inspect:

* Repository
* Existing routes
* Components
* Dependencies
* Configuration
* Current implementation

### STEP 2 — READ DOCS

Read relevant installed documentation before using unfamiliar APIs.

For Next.js specifically, inspect:

`node_modules/next/dist/docs/`

### STEP 3 — UNDERSTAND

Identify:

* Existing architecture
* Reusable components
* Existing design system
* Existing data models
* Existing routes

### STEP 4 — PLAN

Determine the smallest clean implementation that solves the problem.

### STEP 5 — IMPLEMENT

Write the code.

### STEP 6 — TYPE CHECK

Run type checking.

### STEP 7 — LINT

Run linting.

### STEP 8 — TEST

Run relevant tests.

### STEP 9 — START THE APPLICATION YOURSELF

Do not ask the user to start it.

Start the development server or appropriate application environment yourself.

### STEP 10 — VERIFY THE ACTUAL APPLICATION

Open and verify the relevant route/page.

### STEP 11 — TEST THE USER JOURNEY

Test the actual interaction.

For example:

Create Farm
→ Select Index
→ Select Template
→ Configure
→ Upload Logo
→ Upload Document
→ Review
→ Publish

### STEP 12 — CHECK ERRORS

Inspect:

* Browser console
* Terminal
* Runtime errors
* Network errors
* Build errors

### STEP 13 — FIX

Fix problems discovered during verification.

### STEP 14 — RE-RUN

Re-run:

* Type check
* Lint
* Tests
* Build
* Application verification

as appropriate.

### STEP 15 — REPORT

Only report completion after the implementation has actually been verified.

# 46. DO NOT ASK THE USER TO DO WHAT THE AGENT CAN DO

Never respond with instructions like:

> Please run npm install.

if the agent can run it.

Never respond with:

> Please start the development server.

if the agent can start it.

Never respond with:

> Please check whether the page works.

if the agent can verify it.

Never respond with:

> Please test the flow.

if the agent can test it.

Instead:

Do the action.

Verify the result.

Fix issues.

Then report what was done.

# 47. WHEN BLOCKED

If the agent genuinely cannot complete an action, identify the exact reason.

Examples:

* Wallet signature requires user interaction.
* Production credentials are unavailable.
* External API requires authentication.
* A third-party service is unavailable.
* A human design decision is required.

Do not claim success.

Clearly separate:

### Completed

What was actually done.

### Blocked

What could not be completed and why.

### Recommended next action

Only if necessary.

# 48. NO PREMATURE COMPLETION

Never say:

> Done.

merely because files were modified.

Completion requires implementation + verification whenever technically possible.

# 49. REUSABILITY

Before creating a component, check whether an existing component can be reused.

Prefer:

* Existing Button
* Existing Input
* Existing Modal
* Existing Table
* Existing Chart
* Existing Card
* Existing Upload
* Existing Toast
* Existing Tabs

over creating duplicate versions.

# 50. UX QUALITY BAR

Before considering a screen complete, ask:

* Is the primary action obvious?
* Can a new user understand this screen?
* Is there unnecessary information?
* Is the hierarchy clear?
* Are important financial metrics easy to scan?
* Are risks understandable?
* Are loading/error/empty states handled?
* Is the interface responsive?
* Does it feel professional?
* Does it feel like a real product rather than a prototype?

# 51. FARM MANAGER QUALITY BAR

A Farm Manager should be able to:

1. Sign in
2. Create Farm
3. Choose Index / Spot / Perpetual
4. Select a template
5. Add Farm details
6. Upload logo
7. Configure strategy
8. Upload supporting documents
9. Preview strategy
10. Review Farm
11. Deploy Farm
12. Monitor performance
13. Manage liquidity
14. Manage LPs
15. Rebalance
16. Pause
17. Archive
18. Review activity

# 52. LP QUALITY BAR

An LP should be able to:

1. Explore Farms
2. Search and filter
3. Open Farm Profile
4. Understand strategy
5. Understand risk
6. Review performance
7. Review supporting documents
8. Review Farm Manager
9. Review fees
10. Review liquidity
11. Decide whether to deposit
12. Deposit
13. Monitor position
14. Withdraw

# 53. CORE PRODUCT LOOP

The product should create this continuous loop:

Farm Explorer
→ Farm Profile
→ Farm Creation
→ Farm Manager
→ Analytics
→ Optimization
→ LPs
→ Deposits
→ Performance
→ Farm Profile

# 54. FINAL IMPLEMENTATION RULE

The agent is responsible for delivering a working implementation, not merely generating code.

Whenever tools and environment access allow it:

> Inspect → Build → Run → Verify → Fix → Re-run → Complete

Do not stop at:

> Inspect → Build → Tell the user what to do next.

The agent should take ownership of the implementation and verification process.

# 55. ICON SYSTEM

Use Phosphor Icons as the default icon system throughout this project.

* Import interface icons from `@phosphor-icons/react`.
* Choose the closest semantic Phosphor icon for each action, status, navigation item, or data concept.
* Use the regular weight by default and stronger weights only when hierarchy or state requires them.
* Keep icon sizing and optical weight consistent within each control group.
* Provide accessible labels for icon-only interactive controls.
* Do not introduce new Lucide icons. Migrate remaining Lucide usage to Phosphor when editing the affected component.
* Do not replace product or network brand assets with generic interface icons.
