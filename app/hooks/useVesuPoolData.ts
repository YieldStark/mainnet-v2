// React hook for fetching Vesu pool data
import { useState, useEffect } from "react";
import { fetchAllPoolsViaRPC } from "~/lib/services/vesuPoolDataRPC";
import { useNetworkStore } from "~/stores/network-store";

export interface PoolData {
  id: string;
  poolAddress: string;
  vTokenAddress: string;
  assetAddress: string;
  decimals: number;
  apy: string;
  supplyAPY: string;
  borrowAPY: string;
  tvl: string;
  utilization: string;
  totalSupply: string;
  totalBorrow: string;
}

export function useVesuPoolData() {
  const [poolsData, setPoolsData] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!currentNetwork.rpcUrl) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchAllPoolsViaRPC(currentNetwork.rpcUrl);
        
        if (isMounted) {
          setPoolsData(data);
        }
      } catch (err) {
        console.error("Error fetching Vesu pool data:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch pool data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    // Refresh data every 2 minutes
    const interval = setInterval(fetchData, 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentNetwork.rpcUrl]);

  const getPoolData = (poolId: string) => {
    return poolsData.find((pool) => pool.id === poolId);
  };

  return {
    poolsData,
    isLoading,
    error,
    getPoolData,
  };
}
