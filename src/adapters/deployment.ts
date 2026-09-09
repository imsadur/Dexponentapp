import { Farm, StrategyTemplate, validateStrategy } from "../domain/strategy";
export type TransactionState =
  | "Waiting"
  | "Confirm in wallet"
  | "Submitting"
  | "Confirming"
  | "Completed"
  | "Failed";
export type Transaction = {
  label: string;
  state: TransactionState;
  hash?: string;
  error?: string;
};
export type Deployment = {
  mode: "preview" | "live";
  steps: Transaction[];
  cost: string;
  contractAddress?: string;
};
export interface DeploymentAdapter {
  prepare(farm: Farm, template: StrategyTemplate): Deployment;
  execute(farm: Farm): Promise<never>;
}
export const deploymentAdapter: DeploymentAdapter = {
  prepare(farm, template) {
    if (
      Object.keys(
        validateStrategy(template, farm.values, farm.allocations, farm.network),
      ).length
    )
      throw new Error(
        "Resolve configuration errors before preparing deployment.",
      );
    return {
      mode: "preview",
      cost: "Unavailable until connected to contracts",
      steps: [
        "Connect wallet",
        "Approve assets",
        "Deploy strategy",
        "Initialize farm",
        "Verify contract",
        "Activate farm",
      ].map((label) => ({ label, state: "Waiting" })),
    };
  },
  async execute() {
    throw new Error(
      "Live deployment is not configured. No transaction was sent.",
    );
  },
};
