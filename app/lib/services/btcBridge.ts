/**
 * Non-custodial BTC bridge integration via Layerswap.
 *
 * Moves WBTC between Ethereum and Starknet. YieldStark never holds funds:
 * the user signs on the source chain in the Layerswap widget and Layerswap
 * settles the transfer to the user's own address on the destination chain.
 *
 * Docs: https://docs.layerswap.io/integration/UI/Widget/Starknet/Starknet
 */

import { BRIDGE_CONFIG } from "../config";

export type BridgeDirection = "deposit" | "withdraw";

/** Layerswap network identifiers used by this integration. */
export const BRIDGE_NETWORKS = {
  // Layerswap does not support WBTC routes on Arbitrum; Ethereum mainnet is supported.
  ETHEREUM: "ETHEREUM_MAINNET",
  STARKNET: "STARKNET_MAINNET",
} as const;

export const BRIDGE_ASSET = BRIDGE_CONFIG.ASSET;

export interface BridgeWidgetInitialValues {
  from: string;
  to: string;
  fromAsset: string;
  toAsset: string;
  destAddress?: string;
  lockFrom?: boolean;
  lockTo?: boolean;
  lockFromAsset?: boolean;
  lockToAsset?: boolean;
  actionButtonText?: string;
}

/**
 * Builds the Layerswap widget `initialValues` for a given bridge direction.
 *
 * - deposit: Ethereum (source) -> Starknet (destination), prefilled with the
 *   user's connected Starknet address so WBTC lands directly in their wallet.
 * - withdraw: Starknet (source) -> Ethereum (destination).
 */
export function getBridgeInitialValues(
  direction: BridgeDirection,
  starknetAddress?: string
): BridgeWidgetInitialValues {
  if (direction === "deposit") {
    return {
      from: BRIDGE_NETWORKS.ETHEREUM,
      to: BRIDGE_NETWORKS.STARKNET,
      fromAsset: BRIDGE_ASSET,
      toAsset: BRIDGE_ASSET,
      destAddress: starknetAddress,
      lockFrom: true,
      lockTo: true,
      lockFromAsset: true,
      lockToAsset: true,
      actionButtonText: "Deposit",
    };
  }

  return {
    from: BRIDGE_NETWORKS.STARKNET,
    to: BRIDGE_NETWORKS.ETHEREUM,
    fromAsset: BRIDGE_ASSET,
    toAsset: BRIDGE_ASSET,
    lockFrom: true,
    lockTo: true,
    lockFromAsset: true,
    lockToAsset: true,
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
    transactions: Array<{
      type: string;
      from: string;
      to: string;
      transaction_hash: string;
      amount: number;
    }>;
  };
}

/** True when a completed swap represents an Ethereum -> Starknet deposit. */
export function isDepositSwap(swap: LayerswapCompletedSwap["swap"]): boolean {
  return swap.destination_network.name === BRIDGE_NETWORKS.STARKNET;
}

/** True when a completed swap represents a Starknet -> Ethereum withdrawal. */
export function isWithdrawSwap(swap: LayerswapCompletedSwap["swap"]): boolean {
  return swap.source_network.name === BRIDGE_NETWORKS.STARKNET;
}
