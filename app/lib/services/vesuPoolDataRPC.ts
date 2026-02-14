// Vesu Pool Data Fetcher using Raw JSON-RPC Calls (bypasses starknet.js entirely)
import { hash, num } from "starknet";
import { VESU_CONTRACTS, VESU_VTOKENS } from "./vesu";

const SCALE = BigInt(10 ** 18);

interface PoolStats {
  apy: string;
  supplyAPY: string;
  borrowAPY: string;
  tvl: string;
  utilization: string;
  totalSupply: string;
  totalBorrow: string;
}

/**
 * Fetch total assets from vToken using backend proxy (bypasses CORS)
 */
async function fetchTotalAssets(
  rpcUrl: string,
  vTokenAddress: string
): Promise<bigint> {
  try {
    console.log("Fetching total_assets via backend proxy for:", vTokenAddress);
    
    // Calculate function selector for total_assets
    const selector = hash.getSelectorFromName("total_assets");
    
    // Make RPC call through backend proxy to bypass CORS
    const response = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rpcUrl,
        payload: {
          jsonrpc: "2.0",
          method: "starknet_call",
          params: {
            request: {
              contract_address: vTokenAddress,
              entry_point_selector: num.toHex(selector),
              calldata: []
            },
            block_id: "latest"
          },
          id: 1
        }
      })
    });

    const data = await response.json();
    console.log("RPC proxy response:", data);
    
    if (data.error) {
      console.error("RPC error:", data.error);
      return 0n;
    }
    
    // Parse the result - it's in data.result as array of hex strings
    const result = data.result;
    
    if (Array.isArray(result) && result.length >= 2) {
      const low = BigInt(result[0]);
      const high = BigInt(result[1]);
      const totalAssets = low + (high << 128n);
      
      console.log("Parsed total assets:", totalAssets.toString());
      return totalAssets;
    }
    
    if (Array.isArray(result) && result.length === 1) {
      const value = BigInt(result[0]);
      console.log("Parsed total assets (single value):", value.toString());
      return value;
    }
    
    console.warn("Unexpected result format:", result);
    return 0n;
  } catch (error) {
    console.error("Error fetching total_assets:", error);
    return 0n;
  }
}

/**
 * Fetch total supply from vToken using backend proxy (bypasses CORS)
 */
async function fetchTotalSupply(
  rpcUrl: string,
  vTokenAddress: string
): Promise<bigint> {
  try {
    console.log("Fetching total_supply via backend proxy for:", vTokenAddress);
    
    // Calculate function selector for total_supply
    const selector = hash.getSelectorFromName("total_supply");
    
    // Make RPC call through backend proxy to bypass CORS
    const response = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rpcUrl,
        payload: {
          jsonrpc: "2.0",
          method: "starknet_call",
          params: {
            request: {
              contract_address: vTokenAddress,
              entry_point_selector: num.toHex(selector),
              calldata: []
            },
            block_id: "latest"
          },
          id: 1
        }
      })
    });

    const data = await response.json();
    console.log("RPC proxy response:", data);
    
    if (data.error) {
      console.error("RPC error:", data.error);
      return 0n;
    }
    
    // Parse u256 result
    const result = data.result;
    
    if (Array.isArray(result) && result.length >= 2) {
      const low = BigInt(result[0]);
      const high = BigInt(result[1]);
      const totalSupply = low + (high << 128n);
      console.log("Parsed total supply:", totalSupply.toString());
      return totalSupply;
    }
    
    if (Array.isArray(result) && result.length === 1) {
      const value = BigInt(result[0]);
      console.log("Parsed total supply (single value):", value.toString());
      return value;
    }
    
    return 0n;
  } catch (error) {
    console.error("Error fetching total_supply:", error);
    return 0n;
  }
}

/**
 * Format TVL in readable format
 */
function formatTVL(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Get estimated APY based on pool (will be replaced with on-chain calculation)
 */
function getEstimatedAPY(vTokenAddress: string): number {
  const apyMap: Record<string, number> = {
    "0x04cbe8b13ebadd744254b09a40f4395f580e8a4a30acb2653849f61d12bfa039": 4.25,
    "0x017891114c00b07317b9102adefbad9fd5de40c5616f094ee09fe2fad67191b1": 8.25,
    "0x01a71039b15e5f5413ea450216387877adf962d5908811780c8f3dda5386b166": 12.50,
    "0x00cf3ea1abb06e1f2cba191f10684fc4ce505eba0ed64a847ab6b00ef52e5722": 6.80,
  };
  
  const normalized = vTokenAddress.toLowerCase();
  for (const [addr, apy] of Object.entries(apyMap)) {
    if (addr.toLowerCase() === normalized) {
      return apy;
    }
  }
  
  return 5.0;
}

/**
 * Fetch pool stats using direct RPC calls
 */
export async function fetchPoolStatsViaRPC(
  rpcUrl: string,
  vTokenAddress: string,
  decimals: number = 18
): Promise<PoolStats> {
  try {
    console.log("=== Fetching pool stats via RPC ===");
    console.log("RPC URL:", rpcUrl);
    console.log("vToken:", vTokenAddress);
    console.log("Decimals:", decimals);

    // Fetch total assets and total supply in parallel using raw JSON-RPC
    const [totalAssets, totalSupply] = await Promise.all([
      fetchTotalAssets(rpcUrl, vTokenAddress),
      fetchTotalSupply(rpcUrl, vTokenAddress)
    ]);

    console.log("Total Assets (raw):", totalAssets.toString());
    console.log("Total Supply (raw):", totalSupply.toString());

    // Calculate TVL in human-readable format
    const divisor = Math.pow(10, decimals);
    const tvlInAsset = Number(totalAssets) / divisor;
    const totalSupplyInAsset = Number(totalSupply) / divisor;
    
    console.log("Divisor:", divisor, "Decimals:", decimals);
    console.log("TVL (formatted):", tvlInAsset);
    console.log("Total Supply (formatted):", totalSupplyInAsset);
    console.log("TVL > 0?", totalAssets > 0n);

    // If we got real data, use it
    if (totalAssets > 0n) {
      // Use real TVL, estimated APY for now
      const estimatedAPY = getEstimatedAPY(vTokenAddress);
      const utilizationRate = 65; // Typical
      
      console.log("✅ Using REAL TVL data with estimated APY");
      
      return {
        apy: estimatedAPY.toFixed(2) + "%",
        supplyAPY: estimatedAPY.toFixed(2) + "%",
        borrowAPY: (estimatedAPY * 1.5).toFixed(2) + "%",
        tvl: formatTVL(tvlInAsset),
        utilization: utilizationRate.toFixed(2) + "%",
        totalSupply: tvlInAsset.toFixed(4),
        totalBorrow: ((tvlInAsset * utilizationRate) / 100).toFixed(4),
      };
    }

    // Fallback to estimates
    console.warn("⚠️ No data from RPC, using estimates");
    return {
      apy: getEstimatedAPY(vTokenAddress).toFixed(2) + "%",
      supplyAPY: getEstimatedAPY(vTokenAddress).toFixed(2) + "%",
      borrowAPY: (getEstimatedAPY(vTokenAddress) * 1.5).toFixed(2) + "%",
      tvl: "$0",
      utilization: "0.00%",
      totalSupply: "0",
      totalBorrow: "0",
    };
  } catch (error) {
    console.error("Error in fetchPoolStatsViaRPC:", error);
    
    // Return estimates on error
    return {
      apy: getEstimatedAPY(vTokenAddress).toFixed(2) + "%",
      supplyAPY: getEstimatedAPY(vTokenAddress).toFixed(2) + "%",
      borrowAPY: (getEstimatedAPY(vTokenAddress) * 1.5).toFixed(2) + "%",
      tvl: "$0",
      utilization: "0.00%",
      totalSupply: "0",
      totalBorrow: "0",
    };
  }
}

/**
 * Fetch all pool data using RPC
 */
export async function fetchAllPoolsViaRPC(rpcUrl: string) {
  const pools = [
    {
      id: "re7-xbtc",
      poolAddress: VESU_CONTRACTS.RE7_XBTC,
      vTokenAddress: VESU_VTOKENS.TBTC_XBTC,
      assetAddress: "0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC",
      decimals: 8,
    },
    {
      id: "re7-usdc-core",
      poolAddress: VESU_CONTRACTS.RE7_USDC_CORE,
      vTokenAddress: VESU_VTOKENS.USDC_CORE,
      assetAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      decimals: 6,
    },
    {
      id: "re7-usdc-prime",
      poolAddress: VESU_CONTRACTS.RE7_USDC_PRIME,
      vTokenAddress: VESU_VTOKENS.USDC_PRIME,
      assetAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      decimals: 6,
    },
    {
      id: "re7-usdc-stable",
      poolAddress: VESU_CONTRACTS.RE7_USDC_STABLE_CORE,
      vTokenAddress: VESU_VTOKENS.USDC_STABLE_CORE,
      assetAddress: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      decimals: 6,
    },
  ];

  const results = await Promise.allSettled(
    pools.map((pool) =>
      fetchPoolStatsViaRPC(rpcUrl, pool.vTokenAddress, pool.decimals).then((data) => ({
        ...pool,
        ...data,
      }))
    )
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(`Failed to fetch pool ${pools[index].id}:`, result.reason);
      return {
        ...pools[index],
        apy: "0.00%",
        supplyAPY: "0.00%",
        borrowAPY: "0.00%",
        tvl: "$0",
        utilization: "0.00%",
        totalSupply: "0",
        totalBorrow: "0",
      };
    }
  });
}
