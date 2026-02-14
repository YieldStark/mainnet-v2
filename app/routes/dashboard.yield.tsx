import { useState, useEffect } from "react";
import { TrendingUp, Info } from "lucide-react";
import { VESU_LENDING_POOLS, type VesuPool } from "~/lib/services/vesu";
import VesuLendModal from "~/components/ui/VesuLendModal";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useAccount } from "@starknet-react/core";
import toast from "react-hot-toast";

export default function YieldPage() {
  const [selectedPool, setSelectedPool] = useState<VesuPool | null>(null);
  const [isLendModalOpen, setIsLendModalOpen] = useState(false);
  const { account } = useAccount();
  const isConnected = useWalletStore((state) => state.isConnected);
  
  // Mock balances - these should be fetched from wallet
  const [balances, setBalances] = useState({
    WBTC: "0.0",
    USDC: "0.0",
  });

  const handleOpenLendModal = (pool: VesuPool) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    setSelectedPool(pool);
    setIsLendModalOpen(true);
  };

  const handleDeposit = async (poolId: string, amount: string) => {
    if (!account) {
      throw new Error("Wallet not connected");
    }

    try {
      // TODO: Implement actual deposit logic using vesu service
      toast.success(`Depositing ${amount} to ${poolId}...`);
      
      // This is a placeholder - actual implementation will use:
      // 1. Approve token spending
      // 2. Call depositToVesu from vesu service
      // await depositToVesu(account, vTokenAddress, parseAmount, receiverAddress);
      
      throw new Error("Deposit functionality is not yet fully implemented");
    } catch (error) {
      console.error("Deposit error:", error);
      throw error;
    }
  };

  const wbtcPools = VESU_LENDING_POOLS.filter((pool) => pool.asset === "WBTC");
  const usdcPools = VESU_LENDING_POOLS.filter((pool) => pool.asset === "USDC");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h1 className="text-3xl font-medium text-white mb-2">Yield</h1>
        <p className="text-gray-400">
          Earn yield by lending your assets to Vesu protocol pools
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#97FCE4]/10 border border-[#97FCE4]/20 rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <Info className="text-[#97FCE4] mt-0.5" size={20} />
          <div>
            <h3 className="text-[#97FCE4] font-medium mb-1">
              About Vesu Lending
            </h3>
            <p className="text-sm text-gray-300">
              Vesu is Starknet's most trusted lending market. By depositing your
              assets, you earn yield from borrowers while maintaining liquidity
              through vTokens (ERC-4626 vault tokens).
            </p>
          </div>
        </div>
      </div>

      {/* WBTC Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium text-white">WBTC Pools</h2>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {wbtcPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onDeposit={() => handleOpenLendModal(pool)}
            />
          ))}
        </div>
      </div>

      {/* USDC Pools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium text-white">USDC Pools</h2>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usdcPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onDeposit={() => handleOpenLendModal(pool)}
            />
          ))}
        </div>
      </div>

      {/* Lend Modal */}
      <VesuLendModal
        isOpen={isLendModalOpen}
        onClose={() => setIsLendModalOpen(false)}
        pool={selectedPool}
        onDeposit={handleDeposit}
        userBalance={selectedPool ? balances[selectedPool.asset] : "0"}
      />
    </div>
  );
}

interface PoolCardProps {
  pool: VesuPool;
  onDeposit: () => void;
}

function PoolCard({ pool, onDeposit }: PoolCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "High":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="bg-[#101D22] rounded-3xl p-6 border border-gray-800 hover:border-[#97FCE4]/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-medium text-white mb-1">{pool.name}</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
              pool.riskLevel
            )}`}
          >
            {pool.riskLevel} Risk
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#97FCE4] flex items-center gap-1">
            <TrendingUp size={20} />
            {pool.apy}
          </div>
          <span className="text-xs text-gray-400">APY</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4">{pool.description}</p>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <span className="text-sm text-gray-400">Total Value Locked</span>
        <span className="text-sm font-medium text-white">{pool.tvl}</span>
      </div>

      <button
        onClick={onDeposit}
        className="w-full px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors"
      >
        Lend {pool.asset}
      </button>
    </div>
  );
}
