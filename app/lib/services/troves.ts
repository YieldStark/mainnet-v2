/**
 * TrovesFi yield integration – Ekubo WBTC/USDC and WBTC/USDC.e vaults.
 * APY/TVL: https://app.troves.fi/api/strategies
 * You interact with the Vault contract only; deposit requires equal value of both tokens.
 */

import { uint256, RpcProvider } from "starknet";
import { approveToken, checkAllowance } from "../utils/tokenApproval";

/** Call vault's balance_of (share balance for user) */
export async function getTrovesVaultShareBalance(
  rpcUrl: string,
  vaultAddress: string,
  userAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const result = await provider.callContract({
      contractAddress: vaultAddress,
      entrypoint: "balance_of",
      calldata: [userAddress],
    });
    const arr: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result ?? [];
    if (arr.length < 2) return 0n;
    return uint256.uint256ToBN({ low: arr[0], high: arr[1] });
  } catch {
    return 0n;
  }
}

/** Call vault's total_assets (if ERC4626-like) for share-to-value ratio */
export async function getTrovesVaultTotalAssets(
  rpcUrl: string,
  vaultAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const result = await provider.callContract({
      contractAddress: vaultAddress,
      entrypoint: "total_assets",
      calldata: [],
    });
    const arr: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result ?? [];
    if (arr.length < 2) return 0n;
    return uint256.uint256ToBN({ low: arr[0], high: arr[1] });
  } catch {
    return 0n;
  }
}

/** Call vault's total_supply (shares) for share-to-value ratio */
export async function getTrovesVaultTotalSupply(
  rpcUrl: string,
  vaultAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const result = await provider.callContract({
      contractAddress: vaultAddress,
      entrypoint: "total_supply",
      calldata: [],
    });
    const arr: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result ?? [];
    if (arr.length < 2) return 0n;
    return uint256.uint256ToBN({ low: arr[0], high: arr[1] });
  } catch {
    return 0n;
  }
}

const APPROVAL_WAIT_OPTIONS = {
  retryInterval: 3000,
  successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"] as const,
  timeout: 120000,
};

const DELAY_BEFORE_DEPOSIT_MS = 2000;

const TROVES_STRATEGIES_API = "https://app.troves.fi/api/strategies";

export interface TrovesDepositToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export interface TrovesStrategy {
  name: string;
  id: string;
  apy: number | null;
  apySplit?: { baseApy: number | null; rewardsApy: number };
  apyMethodology?: string;
  depositToken: TrovesDepositToken[];
  leverage: number;
  contract: { name: string; address: string }[];
  contractDetails: { name: string; address: string }[];
  tvlUsd: number;
  status?: { number: number; value: string };
  riskFactor?: number;
  logos?: string[];
  isAudited?: boolean;
  auditUrl?: string;
  tags?: string[];
}

export interface TrovesApiResponse {
  status: boolean;
  strategies: TrovesStrategy[];
  lastUpdated?: string;
}

/** Vault address = contractDetails[0].address for Ekubo CL strategies */
export function getVaultAddress(strategy: TrovesStrategy): string {
  const vault = strategy.contractDetails?.find(
    (c) => c.name.toLowerCase() === "vault"
  );
  if (!vault) {
    throw new Error(`No Vault in contractDetails for strategy ${strategy.id}`);
  }
  return vault.address;
}

/** Strategy ids for WBTC/USDC and WBTC/USDC.e */
export const TROVES_WBTC_USDC_STRATEGY_IDS = [
  "ekubo_cl_wbtcusdc_v2", // Ekubo WBTC/USDC
  "ekubo_cl_wbtcusdc",     // Ekubo WBTC/USDC.e
] as const;

/**
 * Fetch strategies from Troves API with fallback to local JSON.
 */
export async function fetchTrovesStrategies(
  fallbackStrategies?: TrovesStrategy[]
): Promise<TrovesStrategy[]> {
  try {
    const res = await fetch(TROVES_STRATEGIES_API);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data: TrovesApiResponse = await res.json();
    if (data?.status && Array.isArray(data.strategies)) {
      return data.strategies;
    }
  } catch (e) {
    console.warn("Troves API fetch failed, using fallback:", e);
  }
  if (Array.isArray(fallbackStrategies) && fallbackStrategies.length > 0) {
    return fallbackStrategies;
  }
  return [];
}

/**
 * Get WBTC/USDC and WBTC/USDC.e strategies from a strategies list.
 */
export function getTrovesWbtcUsdcStrategies(
  strategies: TrovesStrategy[]
): TrovesStrategy[] {
  return strategies.filter((s) =>
    TROVES_WBTC_USDC_STRATEGY_IDS.includes(s.id as typeof TROVES_WBTC_USDC_STRATEGY_IDS[number])
  );
}

export type TrovesDepositOptions = {
  /** Called before the first approval (token0). */
  onBeforeApprove0?: () => void | Promise<void>;
  /** Called before the second approval (token1). */
  onBeforeApprove1?: () => void | Promise<void>;
  /** Called right before the deposit transaction so the UI can tell the user to check their wallet. */
  onBeforeDeposit?: () => void | Promise<void>;
};

/**
 * Approve both deposit tokens for the vault (exact amounts to reduce wallet warnings),
 * wait for each approval to confirm, then call vault deposit after a short delay
 * so the wallet has time to show the deposit signing popup.
 * Token order must match strategy.depositToken: [token0, token1].
 */
export async function depositToTrovesVault(
  account: any,
  rpcUrl: string,
  vaultAddress: string,
  token0Address: string,
  token1Address: string,
  amount0: bigint,
  amount1: bigint,
  receiverAddress: string,
  options?: TrovesDepositOptions
): Promise<string> {
  // 1. Approve token0 (exact amount – fewer wallet warnings than unlimited)
  const allowance0 = await checkAllowance(
    rpcUrl,
    token0Address,
    receiverAddress,
    vaultAddress
  );
  if (allowance0 < amount0) {
    if (options?.onBeforeApprove0) await options.onBeforeApprove0();
    const txHash0 = await approveToken(
      account,
      token0Address,
      vaultAddress,
      amount0
    );
    await account.waitForTransaction(txHash0, APPROVAL_WAIT_OPTIONS);
  }

  // 2. Approve token1 (exact amount)
  const allowance1 = await checkAllowance(
    rpcUrl,
    token1Address,
    receiverAddress,
    vaultAddress
  );
  if (allowance1 < amount1) {
    if (options?.onBeforeApprove1) await options.onBeforeApprove1();
    const txHash1 = await approveToken(
      account,
      token1Address,
      vaultAddress,
      amount1
    );
    await account.waitForTransaction(txHash1, APPROVAL_WAIT_OPTIONS);
  }

  // 3. Give the wallet time to show the next popup, and tell the user to check it
  if (options?.onBeforeDeposit) {
    await options.onBeforeDeposit();
  }
  await new Promise((r) => setTimeout(r, DELAY_BEFORE_DEPOSIT_MS));

  // 4. Vault deposit: amount0 (low, high), amount1 (low, high), receiver
  const a0 = uint256.bnToUint256(amount0);
  const a1 = uint256.bnToUint256(amount1);
  const { transaction_hash } = await account.execute({
    contractAddress: vaultAddress,
    entrypoint: "deposit",
    calldata: [
      a0.low,
      a0.high,
      a1.low,
      a1.high,
      receiverAddress,
    ],
  });
  return transaction_hash;
}
