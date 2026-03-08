import { useEffect, useState } from "react";
import { TrendingUp, ExternalLink, Plus, Minus } from "lucide-react";
import {
  getTrovesWbtcUsdcStrategies,
  getVaultAddress,
  getTrovesVaultShareBalance,
  getTrovesVaultTotalSupply,
  getTrovesVaultTotalAssets,
  type TrovesStrategy,
} from "~/lib/services/troves";
import { useNetworkStore } from "~/stores/network-store";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { fetchTrovesStrategies } from "~/lib/services/troves";
import strategiesFallback from "~/providers/strategies.json";

interface TrovesPosition {
  strategy: TrovesStrategy;
  shareBalance: string;
  shareBalanceRaw: bigint;
  estimatedValueUsd: string;
}

interface TrovesPositionsProps {
  onManagePosition?: (strategy: TrovesStrategy) => void;
  refreshTrigger?: number;
}

export default function TrovesPositions({
  onManagePosition,
  refreshTrigger = 0,
}: TrovesPositionsProps) {
  const [positions, setPositions] = useState<TrovesPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [strategies, setStrategies] = useState<TrovesStrategy[]>([]);
  const address = useWalletStore((state) => state.vaultAddress);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  useEffect(() => {
    const load = async () => {
      const all = await fetchTrovesStrategies(
        (strategiesFallback as { strategies?: TrovesStrategy[] }).strategies ?? []
      );
      setStrategies(getTrovesWbtcUsdcStrategies(all));
    };
    load();
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!address) {
        setPositions([]);
        setIsLoading(false);
        return;
      }
      if (strategies.length === 0) {
        return; // wait for strategies to load
      }

      setIsLoading(true);
      const rpcUrl = currentNetwork.rpcUrl;

      try {
        const results = await Promise.all(
          strategies.map(async (strategy) => {
            const vaultAddress = getVaultAddress(strategy);
            const shareBalance = await getTrovesVaultShareBalance(
              rpcUrl,
              vaultAddress,
              address
            );
            if (shareBalance === 0n) return null;

            const [totalSupply, totalAssets] = await Promise.all([
              getTrovesVaultTotalSupply(rpcUrl, vaultAddress),
              getTrovesVaultTotalAssets(rpcUrl, vaultAddress),
            ]);

            const shareBalanceStr = shareBalance.toString();
            const shareDisplay =
              shareBalanceStr.length > 8
                ? `${shareBalanceStr.slice(0, -8)}.${shareBalanceStr.slice(-8)}`
                : `0.${shareBalanceStr.padStart(8, "0")}`;

            let estimatedValueUsd = "—";
            if (totalSupply > 0n && strategy.tvlUsd > 0) {
              const ratio = Number(shareBalance) / Number(totalSupply);
              estimatedValueUsd = `$${(ratio * strategy.tvlUsd).toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}`;
            }

            return {
              strategy,
              shareBalance: shareDisplay,
              shareBalanceRaw: shareBalance,
              estimatedValueUsd,
            };
          })
        );

        setPositions(
          results.filter((p): p is TrovesPosition => p !== null)
        );
      } catch (error) {
        console.error("TrovesPositions: Failed to fetch positions:", error);
        setPositions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [address, currentNetwork.rpcUrl, strategies.length, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h2 className="text-xl font-medium text-white mb-4">
          Your Troves Positions
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#97FCE4] mx-auto" />
          <p className="text-gray-400 mt-4">Loading positions...</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h2 className="text-xl font-medium text-white mb-4">
          Your Troves Positions
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-gray-600" size={28} />
          </div>
          <p className="text-gray-400 mb-2">No Troves LP positions yet</p>
          <p className="text-sm text-gray-500">
            Deposit into Ekubo WBTC/USDC or WBTC/USDC.e below to get started
          </p>
        </div>
      </div>
    );
  }

  const totalValueUsd = positions.reduce((acc, p) => {
    const num = parseFloat(p.estimatedValueUsd.replace(/[$,]/g, ""));
    return acc + (Number.isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className="bg-[#101D22] rounded-4xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Your Troves Positions</h2>
        <a
          href="https://app.troves.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#97FCE4] hover:underline flex items-center gap-1"
        >
          Open Troves
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="bg-[#0A1215] rounded-2xl p-4 mb-6">
        <p className="text-sm text-gray-400 mb-1">Total Position Value</p>
        <p className="text-3xl font-medium text-white mb-1">
          ${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-500">
          Ekubo LP • Re7 / Troves
        </p>
      </div>

      <div className="space-y-3">
        {positions.map((position, index) => (
          <div
            key={position.strategy.id}
            className="bg-[#0A1215] rounded-2xl p-4 border border-gray-800"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium mb-1">
                  {position.strategy.name}
                </h3>
                <span className="text-xs text-gray-400">LP Shares</span>
              </div>
              <div className="text-right">
                <div className="text-[#97FCE4] font-medium flex items-center gap-1">
                  <TrendingUp size={14} />
                  {position.strategy.apy != null
                    ? `${(position.strategy.apy * 100).toFixed(2)}%`
                    : "—"}{" "}
                  APY
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-400 mb-1">Est. Value</p>
                <p className="text-white font-medium text-lg">
                  {position.estimatedValueUsd}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Share Balance</p>
                <p className="text-gray-300 font-medium">
                  {position.shareBalance}
                </p>
              </div>
            </div>

            {onManagePosition && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onManagePosition(position.strategy)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#97FCE4]/10 text-[#97FCE4] rounded-xl hover:bg-[#97FCE4]/20 transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    Add More
                  </button>
                  <a
                    href={`https://app.troves.fi/strategy/${position.strategy.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Minus size={16} />
                    Withdraw
                  </a>
                </div>
                <a
                  href={`https://app.troves.fi/strategy/${position.strategy.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#97FCE4] transition-colors"
                >
                  <ExternalLink size={12} />
                  Manage on Troves
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
