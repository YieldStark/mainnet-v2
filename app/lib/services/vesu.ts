// Vesu V2 Lending Service
import { RpcProvider, uint256 } from "starknet";
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
  RE7_XBTC: "0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf",
  RE7_USDC_STABLE_CORE: "0x73702fce24aba36da1eac539bd4bae62d4d6a76747b7cdd3e016da754d7a135",
} as const;

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
    id: "vesu-usdc-prime",
    name: "Re7 USDC Prime",
    poolAddress: VESU_CONTRACTS.RE7_USDC_PRIME,
    vTokenAddress: VESU_VTOKENS.USDC_PRIME,
    asset: "USDC",
    assetAddress: USDC_ADDRESS,
    apy: "12.5%", // This should be fetched dynamically
    tvl: "$3.2M", // This should be fetched dynamically
    description: "Earn higher yield by lending USDC to the Re7 USDC Prime pool on Vesu",
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
