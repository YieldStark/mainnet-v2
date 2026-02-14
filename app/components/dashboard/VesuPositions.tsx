import { useEffect, useState } from "react";
import { TrendingUp, ExternalLink } from "lucide-react";
import { VESU_LENDING_POOLS, type VesuPool } from "~/lib/services/vesu";

interface VesuPosition {
  pool: VesuPool;
  depositedAmount: string;
  earnedYield: string;
  currentValue: string;
  vTokenBalance: string;
}

export default function VesuPositions() {
  const [positions, setPositions] = useState<VesuPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual positions from blockchain
    // This would involve:
    // 1. Getting user's vToken balances for each pool
    // 2. Converting vToken shares to underlying assets
    // 3. Calculating earned yield
    
    // Mock data for now
    const mockPositions: VesuPosition[] = [
      // Uncomment to show example positions
      // {
      //   pool: VESU_LENDING_POOLS[0],
      //   depositedAmount: "0.05",
      //   earnedYield: "0.00023",
      //   currentValue: "0.05023",
      //   vTokenBalance: "0.05",
      // },
    ];

    setPositions(mockPositions);
    setIsLoading(false);
  }, []);

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
  const totalYield = positions.reduce(
    (acc, pos) => acc + parseFloat(pos.earnedYield),
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0A1215] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Deposited</p>
          <p className="text-2xl font-medium text-white">
            ${totalValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-[#0A1215] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Earned</p>
          <p className="text-2xl font-medium text-[#97FCE4]">
            +${totalYield.toFixed(4)}
          </p>
        </div>
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

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Deposited</p>
                <p className="text-white font-medium">
                  {position.depositedAmount} {position.pool.asset}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Earned</p>
                <p className="text-[#97FCE4] font-medium">
                  +{position.earnedYield} {position.pool.asset}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Current Value</p>
                <p className="text-white font-medium">
                  {position.currentValue} {position.pool.asset}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
