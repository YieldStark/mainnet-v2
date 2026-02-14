import { useEffect, useState } from "react";
import type { Route } from "./+types/dashboard.index";
import AgentPerformance from "~/components/dashboard/AgentPerformance";
import CurrentPositions from "~/components/dashboard/CurrentPositions";
import VesuPositions from "~/components/dashboard/VesuPositions";
import DepositModal from "~/components/ui/DepositModal";
import WithdrawModal from "~/components/ui/WithdrawModal";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useNetworkStore } from "~/stores/network-store";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - YieldStark" }];
}

export default function DashboardPage() {
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const isConnected = useWalletStore((state) => state.isConnected);
  const updateBalances = useWalletStore((state) => state.updateBalances);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const totalBalance = useWalletStore((state) => state.totalBalance);
  const wbtcBalance = totalBalance > 0 ? totalBalance.toFixed(8) : "0";
  const [refreshKey, setRefreshKey] = useState(0);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);

  useEffect(() => {
    if (isConnected && vaultAddress && currentNetwork.rpcUrl) {
      updateBalances(currentNetwork.rpcUrl);
    }
  }, [isConnected, vaultAddress, currentNetwork.rpcUrl, updateBalances]);

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(vaultAddress);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleDeposit = async (amount: string) => {
    throw new Error("Deposit functionality not implemented");
  };

  const handleWithdraw = async (amount: string) => {
    throw new Error("Withdraw functionality not implemented");
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-6">
                Your Wallet Address:
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-300 font-mono">
                  {isConnected && vaultAddress
                    ? formatAddress(vaultAddress)
                    : "Not connected"}
                </span>
                {isConnected && vaultAddress && (
                  <button
                    onClick={copyToClipboard}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                    title="Copy address"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Total BTC Balance:
              </h3>
              <div className="flex items-baseline gap-3 mb-8 flex-wrap">
                <span className="text-6xl font-medium text-white">
                  {wbtcBalance}
                </span>
                <span className="text-lg text-gray-300">$wbtc</span>
                {isConnected && vaultAddress && (
                  <button
                    type="button"
                    onClick={() => updateBalances(currentNetwork.rpcUrl)}
                    className="text-sm text-[#97FCE4] hover:underline"
                  >
                    Refresh
                  </button>
                )}
              </div>

              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="px-8 py-4 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <AgentPerformance key={`agent-${refreshKey}`} />
          </div>
        </div>
      </div>

      <VesuPositions key={`vesu-${refreshKey}`} />

      <CurrentPositions key={`positions-${refreshKey}`} />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onDeposit={handleDeposit}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}
