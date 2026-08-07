/**
 * Non-custodial bridge integration via Layerswap.
 *
 * Moves assets into or out of Starknet. YieldStark never holds funds:
 * the user signs on the source chain in the Layerswap widget and Layerswap
 * settles the transfer to the user's own address on the destination chain.
 *
 * Docs: https://docs.layerswap.io/integration/UI/Widget/Starknet/Starknet
 */

import { BRIDGE_CONFIG } from "../config";

export type BridgeDirection = "deposit" | "withdraw";

/** Layerswap network identifiers used by this integration. */
export const BRIDGE_NETWORKS = {
  STARKNET: "STARKNET_MAINNET",
} as const;

export interface BridgeWidgetInitialValues {
  from?: string;
  to?: string;
  destAddress?: string;
  lockFrom?: boolean;
  lockTo?: boolean;
  actionButtonText?: string;
}

/**
 * Builds the Layerswap widget `initialValues` for a given bridge direction.
 *
 * - deposit: any supported source chain/token -> Starknet, prefilled with the
 *   user's connected Starknet address.
 * - withdraw: Starknet -> any supported destination chain/token.
 */
export function getBridgeInitialValues(
  direction: BridgeDirection,
  starknetAddress?: string
): BridgeWidgetInitialValues {
  if (direction === "deposit") {
    return {
      to: BRIDGE_NETWORKS.STARKNET,
      destAddress: starknetAddress,
      lockTo: true,
      actionButtonText: "Deposit",
    };
  }

  return {
    from: BRIDGE_NETWORKS.STARKNET,
    lockFrom: true,
    actionButtonText: "Withdraw",
  };
}

/** Shared WalletConnect config passed to Layerswap's EVM + Starknet wallet providers. */
export function getBridgeWalletConnectConfigs() {
  return {
    projectId: BRIDGE_CONFIG.WALLETCONNECT_PROJECT_ID,
    name: "YieldStark",
    description: "Non-custodial Bitcoin DeFi on Starknet",
    url: "https://yieldstark.com",
    icons: ["https://yieldstark.com/logo.png"],
  };
}

/** Minimal shape of the Layerswap `onSwapComplete` callback payload we rely on. */
export interface LayerswapCompletedSwap {
  swap: {
    id: string;
    source_network: { name: string };
    destination_network: { name: string };
    destination_address: string;
    requested_amount: number;
    source_token?: { symbol?: string; decimals?: number };
    destination_token?: { symbol?: string; decimals?: number };
    transactions: Array<{
      type: string;
      from: string;
      to: string;
      transaction_hash: string;
      amount: number;
    }>;
  };
}

export function getSwapTokenSymbol(swap: LayerswapCompletedSwap["swap"]): string {
  return (
    swap.destination_token?.symbol ??
    swap.source_token?.symbol ??
    "UNKNOWN"
  );
}

export function getSwapTokenDecimals(swap: LayerswapCompletedSwap["swap"]): number {
  return (
    swap.destination_token?.decimals ??
    swap.source_token?.decimals ??
    18
  );
}

/** True when a completed swap represents a deposit into Starknet. */
export function isDepositSwap(swap: LayerswapCompletedSwap["swap"]): boolean {
  return swap.destination_network.name === BRIDGE_NETWORKS.STARKNET;
}

/** True when a completed swap represents a withdrawal from Starknet. */
export function isWithdrawSwap(swap: LayerswapCompletedSwap["swap"]): boolean {
  return swap.source_network.name === BRIDGE_NETWORKS.STARKNET;
}
