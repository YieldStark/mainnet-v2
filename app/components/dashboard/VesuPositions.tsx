import { useEffect, useState } from "react";
import { TrendingUp, ExternalLink, Plus, Minus } from "lucide-react";
import { 
  VESU_LENDING_POOLS, 
  type VesuPool, 
  getVTokenBalance, 
  convertSharesToAssets 
} from "~/lib/services/vesu";
import { useNetworkStore } from "~/stores/network-store";
import { useWalletStore } from "~/providers/wallet-store-provider";

interface VesuPosition {
  pool: VesuPool;
  depositedAmount: string;
  earnedYield: string;
  currentValue: string;
  vTokenBalance: string;
}

interface VesuPositionsProps {
  onManagePosition?: (pool: VesuPool, mode: "deposit" | "withdraw") => void;
}

export default function VesuPositions({ onManagePosition }: VesuPositionsProps) {
  const [positions, setPositions] = useState<VesuPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const address = useWalletStore((state) => state.vaultAddress);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!address) {
        console.log("VesuPositions: No address, skipping fetch");
        setPositions([]);
        setIsLoading(false);
        return;
      }

      console.log("VesuPositions: Fetching positions for address:", address);
      setIsLoading(true);

      try {
        const rpcUrl = currentNetwork.rpcUrl;
        const positionsPromises = VESU_LENDING_POOLS.map(async (pool) => {
          try {
            console.log(`Checking position for ${pool.name}...`);
            
            // Get user's vToken balance (shares)
            const vTokenBalance = await getVTokenBalance(
              rpcUrl,
              pool.vTokenAddress,
              address
            );

            console.log(`${pool.name} vToken balance:`, vTokenBalance.toString());

            // Skip if no balance
            if (vTokenBalance === 0n) {
              return null;
            }

            // Convert shares to underlying asset amount
            const assetAmount = await convertSharesToAssets(
              rpcUrl,
              pool.vTokenAddress,
              vTokenBalance
            );

            console.log(`${pool.name} asset amount:`, assetAmount.toString());

            // Calculate decimals
            const decimals = pool.decimals;
            
            // Convert bigint to number safely
            // Use string manipulation to avoid Number() overflow issues
            const assetAmountStr = assetAmount.toString();
            const assetAmountNumber = parseFloat(assetAmountStr) / Math.pow(10, decimals);
            const currentValue = assetAmountNumber.toFixed(decimals);
            
            // Note: Without tracking deposit history, we can't accurately split
            // deposited vs earned. For now, show current value as deposited
            // and earned as 0 (will be fixed when we add event tracking)
            const depositedAmount = currentValue;
            const earnedYield = "0";

            // Format vToken balance for display
            const vTokenBalanceNumber = parseFloat(vTokenBalance.toString()) / Math.pow(10, decimals);
            const vTokenBalanceStr = vTokenBalanceNumber.toFixed(4);

            return {
              pool,
              depositedAmount,
              earnedYield,
              currentValue,
              vTokenBalance: vTokenBalanceStr,
            };
          } catch (error) {
            console.error(`Failed to fetch position for ${pool.name}:`, error);
            return null;
          }
        });

        const results = await Promise.all(positionsPromises);
        const validPositions = results.filter(
          (pos): pos is VesuPosition => pos !== null
        );

        console.log("VesuPositions: Found positions:", validPositions.length);
        setPositions(validPositions);
      } catch (error) {
        console.error("VesuPositions: Failed to fetch positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();

    // Refresh positions every 30 seconds
    const interval = setInterval(fetchPositions, 30000);
    return () => clearInterval(interval);
  }, [address, currentNetwork.rpcUrl]);

  if (isLoading) {
    return (
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h2 className="text-xl font-medium text-white mb-4">
          Your Vesu Positions
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#97FCE4] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading positions...</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h2 className="text-xl font-medium text-white mb-4">
          Your Vesu Positions
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-gray-600" size={28} />
          </div>
          <p className="text-gray-400 mb-2">No active positions</p>
          <p className="text-sm text-gray-500">
            Start earning yield by depositing to a Vesu pool
          </p>
        </div>
      </div>
    );
  }

  const totalValue = positions.reduce(
    (acc, pos) => acc + parseFloat(pos.currentValue),
    0
  );

  return (
    <div className="bg-[#101D22] rounded-4xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Your Vesu Positions</h2>
        <a
          href="https://app.vesu.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#97FCE4] hover:underline flex items-center gap-1"
        >
          Open Vesu App
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Summary Card */}
      <div className="bg-[#0A1215] rounded-2xl p-4 mb-6">
        <p className="text-sm text-gray-400 mb-1">Total Position Value</p>
        <p className="text-3xl font-medium text-white mb-1">
          {totalValue.toFixed(6)} USDC
        </p>
        <p className="text-xs text-gray-500">
          Earning yield continuously • Check back to see growth
        </p>
      </div>

      {/* Positions List */}
      <div className="space-y-3">
        {positions.map((position, index) => (
          <div
            key={index}
            className="bg-[#0A1215] rounded-2xl p-4 border border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium mb-1">
                  {position.pool.name}
                </h3>
                <span className="text-xs text-gray-400">
                  {position.pool.asset} Pool
                </span>
              </div>
              <div className="text-right">
                <div className="text-[#97FCE4] font-medium flex items-center gap-1">
                  <TrendingUp size={14} />
                  {position.pool.apy}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-400 mb-1">Current Value</p>
                <p className="text-white font-medium text-lg">
                  {position.currentValue} {position.pool.asset}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">vToken Shares</p>
                <p className="text-gray-300 font-medium">
                  {position.vTokenBalance}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {onManagePosition && (
              <div className="flex gap-2">
                <button
                  onClick={() => onManagePosition(position.pool, "deposit")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#97FCE4]/10 text-[#97FCE4] rounded-xl hover:bg-[#97FCE4]/20 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Add More
                </button>
                <button
                  onClick={() => onManagePosition(position.pool, "withdraw")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Minus size={16} />
                  Withdraw
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
