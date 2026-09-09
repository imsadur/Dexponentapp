# Deployment boundary

The initial adapter prepares a six-step deployment plan and saves a READY local farm. It never signs, approves, deploys, creates a transaction hash, or marks a farm ACTIVE. No fake blockchain transaction is used to complete the prototype journey.

The interface defines transaction states Waiting, Confirm in wallet, Submitting, Confirming, Completed, Failed; only a future live adapter may advance these from wallet/RPC receipts. Plans cover wallet, approvals, deploy, initialize, verify, activate. Cost, contract address and audit status remain unavailable until an actual integration supplies them.

To connect real contracts: specify chain IDs, supported token addresses, ABI/factory addresses, spender and exact allowance; add wallet network/account subscriptions; simulate contract calls and estimate gas; display approvals; submit on user action; track receipts/replacements/rejections; verify contract and activate only after confirmed receipts. Test insufficient gas, denied signatures, unsupported token/protocol/network, reverted receipts, dropped/replaced transactions and stale account state.
