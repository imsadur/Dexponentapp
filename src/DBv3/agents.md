# DBv3 agent instructions

- This directory owns the independent Dashboard/App v3 concept.
- Do not import UI components, route helpers, providers, data adapters, or styles from the v1/v2 application.
- Keep every authenticated v3 destination under `/dbv3/*`.
- Store demo state under the `dexponent:dbv3:*` namespace only.
- Use `design.md` for visual and interaction decisions.
- Use Phosphor Icons for interface icons and real token/network brand assets for financial symbols.
- Verify the create → deploy → manage → deposit/withdraw/pause → positions lifecycle without navigating to `/app/*`.
- Recheck `/app/*` after any routing change to confirm v2 remains intact.

