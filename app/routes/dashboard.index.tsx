import { useEffect, useState } from "react";
import type { Route } from "./+types/dashboard.index";
import AgentPerformance from "~/components/dashboard/AgentPerformance";
import CurrentPositions from "~/components/dashboard/CurrentPositions";
import VesuPositions from "~/components/dashboard/VesuPositions";
import SendModal from "~/components/ui/SendModal";
import ReceiveModal from "~/components/ui/ReceiveModal";
import { useWalletStore } from "~/providers/wallet-store-provider";
import { useNetworkStore } from "~/stores/network-store";
import { uint256 } from "starknet";
import { WBTC_ADDRESS } from "~/lib/utils/Constants";
import toast from "react-hot-toast";
import { saveLocalTransaction } from "~/lib/utils/transactionHistory";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - YieldStark" }];
}

export default function DashboardPage() {
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const wallet = useWalletStore((state) => state.wallet);
  const isConnected = useWalletStore((state) => state.isConnected);
  const updateBalances = useWalletStore((state) => state.updateBalances);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const totalBalance = useWalletStore((state) => state.totalBalance);
  const wbtcBalance = totalBalance > 0 ? totalBalance.toFixed(8) : "0";
  const [refreshKey, setRefreshKey] = useState(0);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);
  const account = wallet as any;

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

  const handleSend = async (recipientAddress: string, amount: string) => {
    if (!account || !vaultAddress) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    try {
      // Parse amount to smallest unit (8 decimals for WBTC)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** 8));

      if (amountBigInt <= 0n) {
        toast.error("Invalid amount");
        throw new Error("Invalid amount");
      }

      toast.loading("Preparing transaction...", { id: "send-status" });

      // Convert amount to uint256 format
      const amountUint256 = uint256.bnToUint256(amountBigInt);

      // Execute WBTC transfer
      const { transaction_hash } = await account.execute({
        contractAddress: WBTC_ADDRESS,
        entrypoint: "transfer",
        calldata: [
          recipientAddress,
          amountUint256.low,
          amountUint256.high,
        ],
      });

      toast.loading(
        <div>
          <div>Transaction submitted!</div>
          <div className="text-xs mt-1">Waiting for confirmation...</div>
        </div>,
        { id: "send-status" }
      );

      // Wait for transaction confirmation
      try {
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 5000,
          successStates: ["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"],
          timeout: 180000, // 3 minutes
        });

        toast.success(
          <div>
            <div className="font-medium">Transfer successful!</div>
            <a
              href={`${currentNetwork.explorerUrl}/tx/${transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
            >
              View on Explorer
            </a>
          </div>,
          { id: "send-status", duration: 5000 }
        );
      } catch (error: any) {
        if (error?.message?.includes("timeout")) {
          toast.success(
            <div>
              <div className="font-medium">Transaction submitted!</div>
              <div className="text-xs mt-1">Processing on Starknet</div>
              <a
                href={`${currentNetwork.explorerUrl}/tx/${transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline block mt-1"
              >
                Track on Explorer →
              </a>
            </div>,
            { id: "send-status", duration: 10000 }
          );
        } else {
          throw error;
        }
      }

      saveLocalTransaction({
        hash: transaction_hash,
        timestamp: Math.floor(Date.now() / 1000),
        type: "transfer",
        amount,
        from: vaultAddress,
        to: recipientAddress,
        status: "success",
        blockNumber: 0,
        contractLabel: "WBTC",
      });

      // Refresh balance after send
      setTimeout(() => {
        updateBalances(currentNetwork.rpcUrl);
        setRefreshKey((prev) => prev + 1);
      }, 2000);

      return transaction_hash;
    } catch (error: any) {
      console.error("Send error:", error);

      if (error?.message?.includes("User abort") || error?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled", { id: "send-status" });
      } else if (error?.message?.includes("balance")) {
        toast.error("Insufficient balance", { id: "send-status" });
      } else {
        const errorMsg = error?.message || "Transfer failed";
        toast.error(errorMsg, { id: "send-status" });
      }

      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 space-y-6">
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
                  onClick={() => setIsSendModalOpen(true)}
                  disabled={!isConnected}
                  className="px-8 py-4 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
                <button
                  onClick={() => setIsReceiveModalOpen(true)}
                  disabled={!isConnected}
                  className="px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Receive
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

      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSend}
        availableBalance={wbtcBalance}
      />

      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        walletAddress={vaultAddress}
      />
    </div>
  );
}
