// Vesu V2 Lending Service
import { CallData, RpcProvider, uint256 } from "starknet";
import { WBTC_ADDRESS, USDC_ADDRESS } from "../utils/Constants";

// Vesu V2 Contract Addresses (Mainnet)
export const VESU_CONTRACTS = {
  PoolFactory: "0x3760f903a37948f97302736f89ce30290e45f441559325026842b7a6fb388c0",
  Oracle: "0xfe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
  Multiply: "0x7964760e90baa28841ec94714151e03fbc13321797e68a874e88f27c9d58513",
  Liquidate: "0x6b895ba904fb8f02ed0d74e343161de48e611e9e771be4cc2c997501dbfb418",
  
  // Pools
  PRIME: "0x451fe483d5921a2919ddd81d0de6696669bccdacd859f72a4fba7656b97c3b5",
  RE7_USDC_CORE: "0x3976cac265a12609934089004df458ea29c776d77da423c96dc761d09d24124",
  RE7_USDC_PRIME: "0x2eef0c13b10b487ea5916b54c0a7f98ec43fb3048f60fdeedaf5b08f6f88aaf",
  RE7_USDC_FRONTIER: "0x5c03e7e0ccfe79c634782388eb1e6ed4e8e2a013ab0fcc055140805e46261bd",
  RE7_XBTC: "0x03a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
  RE7_USDC_STABLE_CORE: "0x73702fce24aba36da1eac539bd4bae62d4d6a76747b7cdd3e016da754d7a135",
} as const;

export const VESU_RE7_USDC_CORE_BORROW = {
  poolAddress: VESU_CONTRACTS.RE7_USDC_CORE,
  collateralAsset: WBTC_ADDRESS,
  debtAsset:
    "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb", // Native USDC debt asset on Re7 USDC Core
  oracle:
    "0x000fe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
} as const;

export const VESU_PRIME_WBTC_USDT_BORROW = {
  poolAddress: VESU_CONTRACTS.PRIME,
  collateralAsset: WBTC_ADDRESS,
  debtAsset: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
  oracle:
    "0x000fe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
} as const;

export const VESU_RE7_USDC_PRIME_BORROW = {
  poolAddress: VESU_CONTRACTS.RE7_USDC_PRIME,
  collateralAsset: WBTC_ADDRESS,
  debtAsset: USDC_ADDRESS,
  oracle:
    "0x000fe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
} as const;

const RATE_SCALE = 10n ** 18n;

export const VESU_PRIME_POOL = {
  poolAddress: VESU_CONTRACTS.PRIME,
  debtAsset: WBTC_ADDRESS,
  oracle:
    "0x000fe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
} as const;

export const VESU_RE7_XBTC_POOL = {
  poolAddress: VESU_CONTRACTS.RE7_XBTC,
  debtAsset: WBTC_ADDRESS,
  oracle:
    "0x000fe4bfb1b353ba51eb34dff963017f94af5a5cf8bdf3dfc191c504657f3c05",
} as const;

export interface VesuPairCollateralOption {
  symbol: string;
  address: string;
  decimals: number;
}

export interface VesuPrimeCollateralOption extends VesuPairCollateralOption {
  symbol: "USDT" | "STRK" | "USDC" | "ETH" | "xWBTC" | "wstETH";
}

export const VESU_PRIME_COLLATERAL_OPTIONS: VesuPrimeCollateralOption[] = [
  {
    symbol: "USDT",
    address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6,
  },
  {
    symbol: "STRK",
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    decimals: 6,
  },
  {
    symbol: "ETH",
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
  },
  {
    symbol: "xWBTC",
    address: "0x06a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
    decimals: 8,
  },
  {
    symbol: "wstETH",
    address: "0x0057912720381af14b0e5c87aa4718ed5e527eab60b3801ebf702ab09139e38b",
    decimals: 18,
  },
];

export interface VesuXbtcCollateralOption extends VesuPairCollateralOption {
  symbol: "xtBTC" | "xWBTC" | "xsBTC" | "mRe7BTC" | "xLBTC";
}

export const VESU_XBTC_COLLATERAL_OPTIONS: VesuXbtcCollateralOption[] = [
  {
    symbol: "xtBTC",
    address: "0x043a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91",
    decimals: 18,
  },
  {
    symbol: "xWBTC",
    address: "0x06a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
    decimals: 8,
  },
  {
    symbol: "xsBTC",
    address: "0x0580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9",
    decimals: 18,
  },
  {
    symbol: "mRe7BTC",
    address: "0x04e4fb1a9ca7e84bae609b9dc0078ad7719e49187ae7e425bb47d131710eddac",
    decimals: 18,
  },
  {
    symbol: "xLBTC",
    address: "0x07dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0",
    decimals: 8,
  },
];

// vToken addresses for each pool from PoolFactory
export const VESU_VTOKENS = {
  // USDC vTokens (V2)
  USDC_CORE: "0x017891114c00b07317b9102adefbad9fd5de40c5616f094ee09fe2fad67191b1", // vUSDC-Re7USDCCore
  USDC_PRIME: "0x01a71039b15e5f5413ea450216387877adf962d5908811780c8f3dda5386b166", // vWBTC-Re7USDCPrime (WBTC collateral)
  USDC_STABLE_CORE: "0x00cf3ea1abb06e1f2cba191f10684fc4ce505eba0ed64a847ab6b00ef52e5722", // vUSDC-Re7USDCStableCore
  
  // BTC vTokens (V2) - Multiple BTC variants for Re7 xBTC pool
  TBTC_XBTC: "0x04cbe8b13ebadd744254b09a40f4395f580e8a4a30acb2653849f61d12bfa039", // vtBTC-Re7xBTC
  XSBTC_XBTC: "0x076ea5335932dafb727f31dec684e75169e7a582478d681fe3a73494669940fb", // vxsBTC-Re7xBTC
  LBTC_XBTC: "0x073476ed5b0d781182ede4c806241a93cb47cb00b6de354855a1fc6233a13b35", // vLBTC-Re7xBTC
  WBTC_CORE: "0x017bd1b103823b17876f4f9ebc3edc61a34445e17f2ca0ca0e94ee9653ccdf0b", // vWBTC-Re7USDCCore
} as const;

export interface VesuPool {
  id: string;
  name: string;
  poolAddress: string;
  vTokenAddress: string;
  asset: "WBTC" | "USDC";
  assetAddress: string;
  apy: string;
  tvl: string;
  description: string;
  riskLevel: "Low" | "Medium" | "High";
  // Optional live data fields
  utilization?: string;
  supplyAPY?: string;
  borrowAPY?: string;
}

export interface VesuLoanPosition {
  collateralRaw: bigint;
  debtRaw: bigint;
  collateralAmount: number;
  debtAmount: number;
  collateralPriceUsd: number;
  debtPriceUsd: number;
  maxLtv: number;
  currentLtv: number;
  liquidationPriceUsd: number;
}

export interface VesuPoolPairSnapshot {
  collateralAssetAddress: string;
  debtAssetAddress: string;
  maxLtv: number;
  liquidationLtv: number;
  liquidationBonus: number;
  totalDebt: number;
}

function i257FromSignedAmount(amount: bigint) {
  const abs = amount < 0n ? -amount : amount;
  const absUint256 = uint256.bnToUint256(abs);
  return {
    abs: {
      low: absUint256.low.toString(),
      high: absUint256.high.toString(),
    },
    is_negative: amount < 0n ? 1 : 0,
  };
}

function parseUint256FromResult(result: string[], offset: number): bigint {
  const low = BigInt(result[offset] || "0");
  const high = BigInt(result[offset + 1] || "0");
  return low + (high << 128n);
}

// Available Vesu pools for lending
export const VESU_LENDING_POOLS: VesuPool[] = [
  {
    id: "vesu-wbtc-core",
    name: "Re7 USDC Core - WBTC",
    poolAddress: VESU_CONTRACTS.RE7_USDC_CORE,
    vTokenAddress: VESU_VTOKENS.WBTC_CORE, // Correct vToken for WBTC
    asset: "WBTC",
    assetAddress: WBTC_ADDRESS,
    apy: "4.5%", // This should be fetched dynamically
    tvl: "$2.5M", // This should be fetched dynamically
    description: "Earn yield by lending WBTC to the Re7 USDC Core pool on Vesu",
    riskLevel: "Low",
  },
  {
    id: "vesu-usdc-core",
    name: "Re7 USDC Core",
    poolAddress: VESU_CONTRACTS.RE7_USDC_CORE,
    vTokenAddress: VESU_VTOKENS.USDC_CORE,
    asset: "USDC",
    assetAddress: USDC_ADDRESS,
    apy: "8.2%", // This should be fetched dynamically
    tvl: "$5.8M", // This should be fetched dynamically
    description: "Earn yield by lending USDC to the Re7 USDC Core pool on Vesu",
    riskLevel: "Low",
  },
  {
    id: "vesu-wbtc-prime",
    name: "Re7 USDC Prime - WBTC",
    poolAddress: VESU_CONTRACTS.RE7_USDC_PRIME,
    vTokenAddress: VESU_VTOKENS.USDC_PRIME, // This is actually vWBTC for USDC Prime pool
    asset: "WBTC",
    assetAddress: WBTC_ADDRESS,
    apy: "12.5%", // This should be fetched dynamically
    tvl: "$3.2M", // This should be fetched dynamically
    description: "Earn higher yield by lending WBTC as collateral to the Re7 USDC Prime pool on Vesu",
    riskLevel: "Medium",
  },
  {
    id: "vesu-usdc-stable",
    name: "Re7 USDC Stable Core",
    poolAddress: VESU_CONTRACTS.RE7_USDC_STABLE_CORE,
    vTokenAddress: VESU_VTOKENS.USDC_STABLE_CORE,
    asset: "USDC",
    assetAddress: USDC_ADDRESS,
    apy: "6.8%", // This should be fetched dynamically
    tvl: "$4.1M", // This should be fetched dynamically
    description: "Earn stable yield by lending USDC to the Re7 USDC Stable Core pool on Vesu",
    riskLevel: "Low",
  },
];

/**
 * Deposit (supply) assets to a Vesu pool via vToken
 */
export async function depositToVesu(
  account: any,
  vTokenAddress: string,
  amount: bigint,
  receiverAddress: string
): Promise<string> {
  try {
    const amountUint256 = uint256.bnToUint256(amount);
    
    console.log("=== DEPOSIT TO VESU DEBUG ===");
    console.log("Account address:", account.address);
    console.log("vToken address:", vTokenAddress);
    console.log("Amount (bigint):", amount.toString());
    console.log("Amount uint256 low:", amountUint256.low);
    console.log("Amount uint256 high:", amountUint256.high);
    console.log("Receiver address:", receiverAddress);
    console.log("=============================");
    
    const { transaction_hash } = await account.execute({
      contractAddress: vTokenAddress,
      entrypoint: "deposit",
      calldata: [
        amountUint256.low,
        amountUint256.high,
        receiverAddress,
      ],
    });
    
    console.log("Deposit transaction hash:", transaction_hash);
    return transaction_hash;
  } catch (error) {
    console.error("depositToVesu error:", error);
    throw error;
  }
}

/**
 * Withdraw assets from a Vesu pool via vToken
 */
export async function withdrawFromVesu(
  account: any,
  vTokenAddress: string,
  amount: bigint,
  receiverAddress: string,
  ownerAddress: string
): Promise<string> {
  try {
    const amountUint256 = uint256.bnToUint256(amount);
    
    const { transaction_hash } = await account.execute({
      contractAddress: vTokenAddress,
      entrypoint: "withdraw",
      calldata: [
        amountUint256.low,
        amountUint256.high,
        receiverAddress,
        ownerAddress,
      ],
    });
    return transaction_hash;
  } catch (error) {
    console.error("withdrawFromVesu error:", error);
    throw error;
  }
}

/**
 * Modify a Vesu borrow position (Pool::modify_position).
 * Positive collateralDelta => supply collateral, positive debtDelta => borrow debt asset.
 */
export async function modifyVesuPosition(
  account: any,
  poolAddress: string,
  collateralAsset: string,
  debtAsset: string,
  userAddress: string,
  collateralDelta: bigint,
  debtDelta: bigint
): Promise<string> {
  try {
    const calldata = CallData.compile({
      params: {
        collateral_asset: collateralAsset,
        debt_asset: debtAsset,
        user: userAddress,
        collateral: {
          denomination: 1, // AmountDenomination::Assets
          value: i257FromSignedAmount(collateralDelta),
        },
        debt: {
          denomination: 1, // AmountDenomination::Assets
          value: i257FromSignedAmount(debtDelta),
        },
      },
    });

    const { transaction_hash } = await account.execute({
      contractAddress: poolAddress,
      entrypoint: "modify_position",
      calldata,
    });
    return transaction_hash;
  } catch (error) {
    console.error("modifyVesuPosition error:", error);
    throw error;
  }
}

/**
 * Convenience helper for Re7 USDC Core borrow flow:
 * supply WBTC as collateral, borrow USDC.
 */
export async function openRe7WbtcUsdcBorrowPosition(
  account: any,
  userAddress: string,
  collateralAmount: bigint,
  borrowAmount: bigint
): Promise<string> {
  return modifyVesuPosition(
    account,
    VESU_RE7_USDC_CORE_BORROW.poolAddress,
    VESU_RE7_USDC_CORE_BORROW.collateralAsset,
    VESU_RE7_USDC_CORE_BORROW.debtAsset,
    userAddress,
    collateralAmount,
    borrowAmount
  );
}

/**
 * Get user's vToken balance (shares)
 */
export async function getVTokenBalance(
  rpcUrl: string,
  vTokenAddress: string,
  userAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    
    const result = await provider.callContract({
      contractAddress: vTokenAddress,
      entrypoint: "balance_of",
      calldata: [userAddress],
    });

    const resultArray: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result || [];

    if (resultArray.length < 2) {
      return 0n;
    }

    return uint256.uint256ToBN({ low: resultArray[0], high: resultArray[1] });
  } catch (error) {
    console.error("getVTokenBalance error:", error);
    return 0n;
  }
}

/**
 * Convert vToken shares to underlying assets
 */
export async function convertSharesToAssets(
  rpcUrl: string,
  vTokenAddress: string,
  shares: bigint
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    const sharesUint256 = uint256.bnToUint256(shares);
    
    const result = await provider.callContract({
      contractAddress: vTokenAddress,
      entrypoint: "convert_to_assets",
      calldata: [sharesUint256.low, sharesUint256.high],
    });

    const resultArray: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result || [];

    if (resultArray.length < 2) {
      return 0n;
    }

    return uint256.uint256ToBN({ low: resultArray[0], high: resultArray[1] });
  } catch (error) {
    console.error("convertSharesToAssets error:", error);
    return shares; // Return shares as fallback
  }
}

/**
 * Get maximum amount user can withdraw
 */
export async function getMaxWithdraw(
  rpcUrl: string,
  vTokenAddress: string,
  ownerAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    
    const result = await provider.callContract({
      contractAddress: vTokenAddress,
      entrypoint: "max_withdraw",
      calldata: [ownerAddress],
    });

    const resultArray: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result || [];

    if (resultArray.length < 2) {
      return 0n;
    }

    return uint256.uint256ToBN({ low: resultArray[0], high: resultArray[1] });
  } catch (error) {
    console.error("getMaxWithdraw error:", error);
    return 0n;
  }
}

/**
 * Get total assets in the vToken vault
 */
export async function getTotalAssets(
  rpcUrl: string,
  vTokenAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    
    const result = await provider.callContract({
      contractAddress: vTokenAddress,
      entrypoint: "total_assets",
      calldata: [],
    });

    const resultArray: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result || [];

    if (resultArray.length < 2) {
      return 0n;
    }

    return uint256.uint256ToBN({ low: resultArray[0], high: resultArray[1] });
  } catch (error) {
    console.error("getTotalAssets error:", error);
    return 0n;
  }
}

/**
 * Read user's WBTC/USDC borrow position on Re7 USDC Core in real time.
 */
export async function getRe7WbtcUsdcLoanPosition(
  rpcUrl: string,
  userAddress: string
): Promise<VesuLoanPosition> {
  return getVesuLoanPosition(
    rpcUrl,
    VESU_RE7_USDC_CORE_BORROW.poolAddress,
    VESU_RE7_USDC_CORE_BORROW.collateralAsset,
    VESU_RE7_USDC_CORE_BORROW.debtAsset,
    userAddress,
    8,
    6
  );
}

export async function getVesuLoanPosition(
  rpcUrl: string,
  poolAddress: string,
  collateralAsset: string,
  debtAsset: string,
  userAddress: string,
  collateralDecimals: number,
  debtDecimals: number
): Promise<VesuLoanPosition> {
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  const [positionRaw, pairConfigRaw, collateralPriceRaw, debtPriceRaw] = await Promise.all([
    provider.callContract({
      contractAddress: poolAddress,
      entrypoint: "position",
      calldata: [collateralAsset, debtAsset, userAddress],
    }),
    provider.callContract({
      contractAddress: poolAddress,
      entrypoint: "pair_config",
      calldata: [collateralAsset, debtAsset],
    }),
    provider.callContract({
      contractAddress: poolAddress,
      entrypoint: "price",
      calldata: [collateralAsset],
    }),
    provider.callContract({
      contractAddress: poolAddress,
      entrypoint: "price",
      calldata: [debtAsset],
    }),
  ]);

  const positionResult: string[] = Array.isArray(positionRaw)
    ? positionRaw
    : (positionRaw as { result?: string[] })?.result || [];
  const pairResult: string[] = Array.isArray(pairConfigRaw)
    ? pairConfigRaw
    : (pairConfigRaw as { result?: string[] })?.result || [];
  const collateralPriceResult: string[] = Array.isArray(collateralPriceRaw)
    ? collateralPriceRaw
    : (collateralPriceRaw as { result?: string[] })?.result || [];
  const debtPriceResult: string[] = Array.isArray(debtPriceRaw)
    ? debtPriceRaw
    : (debtPriceRaw as { result?: string[] })?.result || [];

  const collateralRaw = parseUint256FromResult(positionResult, 4);
  const debtRaw = parseUint256FromResult(positionResult, 6);

  const collateralAmount = Number(collateralRaw) / 10 ** collateralDecimals;
  const debtAmount = Number(debtRaw) / 10 ** debtDecimals;

  const collateralPriceUsd =
    Number(parseUint256FromResult(collateralPriceResult, 0)) / Number(RATE_SCALE);
  const debtPriceUsd = Number(parseUint256FromResult(debtPriceResult, 0)) / Number(RATE_SCALE);

  const maxLtv = Number(BigInt(pairResult[0] || "0")) / Number(RATE_SCALE);

  const collateralValueUsd = collateralAmount * collateralPriceUsd;
  const debtValueUsd = debtAmount * debtPriceUsd;
  const currentLtv =
    collateralValueUsd > 0 ? Math.max(0, Math.min(5, debtValueUsd / collateralValueUsd)) : 0;
  const liquidationPriceUsd =
    collateralAmount > 0 && maxLtv > 0
      ? debtValueUsd / (collateralAmount * maxLtv)
      : 0;

  return {
    collateralRaw,
    debtRaw,
    collateralAmount,
    debtAmount,
    collateralPriceUsd,
    debtPriceUsd,
    maxLtv,
    currentLtv,
    liquidationPriceUsd,
  };
}

export async function fetchVesuPoolPairs(
  poolId: string
): Promise<VesuPoolPairSnapshot[]> {
  try {
    const response = await fetch(`https://api.vesu.xyz/pools/${poolId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Vesu pools API returned ${response.status}`);
    }
    const payload = await response.json();
    const pairs = Array.isArray(payload?.data?.pairs) ? payload.data.pairs : [];

    return pairs.map((pair: any) => {
      const maxLtv = Number(pair?.maxLTV?.value || 0) / 10 ** (pair?.maxLTV?.decimals || 18);
      const liquidationLtv =
        Number(pair?.liquidationFactor?.value || 0) /
        10 ** (pair?.liquidationFactor?.decimals || 18);
      const liquidationBonus =
        liquidationLtv > 0 ? Math.max(0, (1 / liquidationLtv - 1) * 100) : 0;
      const totalDebt =
        Number(pair?.totalDebt?.value || 0) / 10 ** (pair?.totalDebt?.decimals || 18);

      return {
        collateralAssetAddress: String(pair?.collateralAssetAddress || "").toLowerCase(),
        debtAssetAddress: String(pair?.debtAssetAddress || "").toLowerCase(),
        maxLtv,
        liquidationLtv,
        liquidationBonus,
        totalDebt,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Vesu pool pairs:", error);
    return [];
  }
}
