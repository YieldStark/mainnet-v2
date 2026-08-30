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
import { WBTC_ADDRESS, USDC_ADDRESS } from "~/lib/utils/Constants";
import toast from "react-hot-toast";
import { saveLocalTransaction } from "~/lib/utils/transactionHistory";
import { shield, unshield, transferShielded, readShielded } from "~/lib/services/strk20";
import ShieldModal from "~/components/ui/ShieldModal";
import PrivateTransferModal from "~/components/ui/PrivateTransferModal";
import PrivacyModeToggle from "~/components/ui/PrivacyModeToggle";
import { fetchTokenBalance } from "~/lib/utils/fetchTokenBalance";
import { parseUnits } from "~/lib/utils/parseUnits";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - YieldStark" }];
}

export default function DashboardPage() {
  const vaultAddress = useWalletStore((state) => state.vaultAddress);
  const wallet = useWalletStore((state) => state.wallet);
  const isConnected = useWalletStore((state) => state.isConnected);
  const updateBalances = useWalletStore((state) => state.updateBalances);
  const privacySupported = useWalletStore((state) => state.privacySupported);
  const privacyMode = useWalletStore((state) => state.privacyMode);
  const setPrivacyMode = useWalletStore((state) => state.setPrivacyMode);
  const shieldedBalances = useWalletStore((state) => state.shieldedBalances);
  const refreshShieldedBalances = useWalletStore(
    (state) => state.refreshShieldedBalances
  );
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const [isPrivateTransferOpen, setIsPrivateTransferOpen] = useState(false);
  const [usdcPublic, setUsdcPublic] = useState("0");
  const totalBalance = useWalletStore((state) => state.totalBalance);
  const wbtcBalance = totalBalance > 0 ? totalBalance.toFixed(8) : "0";
  const [refreshKey, setRefreshKey] = useState(0);
  const currentNetwork = useNetworkStore((state) => state.currentNetwork);
  const account = wallet as any;

  useEffect(() => {
    if (isConnected && vaultAddress && currentNetwork.rpcUrl) {
      updateBalances(currentNetwork.rpcUrl);
      fetchTokenBalance(currentNetwork.rpcUrl, USDC_ADDRESS, vaultAddress, 6)
        .then(setUsdcPublic)
        .catch(() => setUsdcPublic("0"));
    }
  }, [isConnected, vaultAddress, currentNetwork.rpcUrl, updateBalances, refreshKey]);

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

  const handleShield = async (
    tokenAddress: string,
    amount: string,
    decimals: number
  ) => {
    if (!wallet || !vaultAddress) throw new Error("Wallet not connected");
    const raw = parseUnits(amount, decimals);
    toast.loading("Shielding… Check Ready. Deposit size and address are public.", {
      id: "shield-status",
    });
    const hash = await shield(wallet, tokenAddress, raw);
    toast.success("Shield submitted", { id: "shield-status" });
    saveLocalTransaction({
      hash,
      timestamp: Math.floor(Date.now() / 1000),
      type: "shield",
      amount,
      from: vaultAddress,
      to: tokenAddress,
      status: "success",
      blockNumber: 0,
      contractLabel: "STRK20 pool",
    });
    await refreshShieldedBalances();
    setRefreshKey((k) => k + 1);
  };

  const handleUnshield = async (
    tokenAddress: string,
    amount: string,
    decimals: number
  ) => {
    if (!wallet || !vaultAddress) throw new Error("Wallet not connected");
    const raw = parseUnits(amount, decimals);
    toast.loading("Unshielding to your public address…", { id: "shield-status" });
    const hash = await unshield(wallet, tokenAddress, raw, vaultAddress);
    toast.success("Unshield submitted", { id: "shield-status" });
    saveLocalTransaction({
      hash,
      timestamp: Math.floor(Date.now() / 1000),
      type: "unshield",
      amount,
      from: vaultAddress,
      to: vaultAddress,
      status: "success",
      blockNumber: 0,
      contractLabel: "STRK20 pool",
    });
    await refreshShieldedBalances();
    updateBalances(currentNetwork.rpcUrl);
    setRefreshKey((k) => k + 1);
  };

  const handlePrivateTransfer = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    recipient: string
  ) => {
    if (!wallet || !vaultAddress) throw new Error("Wallet not connected");
    const raw = parseUnits(amount, decimals);
    toast.loading("Private send: check Ready to prove and submit…", {
      id: "private-transfer",
    });
    const hash = await transferShielded(wallet, tokenAddress, raw, recipient);
    toast.success("Private send submitted", { id: "private-transfer" });
    saveLocalTransaction({
      hash,
      timestamp: Math.floor(Date.now() / 1000),
      type: "private-transfer",
      amount,
      from: vaultAddress,
      to: recipient,
      status: "success",
      blockNumber: 0,
      contractLabel: "STRK20 pool",
    });
    await refreshShieldedBalances();
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

              <div className="flex flex-wrap gap-4 mb-4">
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
                <button
                  onClick={() => setIsShieldModalOpen(true)}
                  disabled={!isConnected || !privacySupported}
                  title={
                    privacySupported
                      ? "Shield or unshield WBTC / USDC"
                      : "Install Ready with STRK20 to shield"
                  }
                  className="px-6 py-2 bg-[#1a2832] text-[#97FCE4] font-medium rounded-full border border-[#97FCE4]/40 hover:bg-[#24343f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Shield
                </button>
                <button
                  onClick={() => setIsPrivateTransferOpen(true)}
                  disabled={!isConnected || !privacySupported}
                  title={
                    privacySupported
                      ? "Send shielded WBTC or USDC to another registered user"
                      : "Install Ready with STRK20 to send privately"
                  }
                  className="px-6 py-2 bg-[#1a2832] text-[#97FCE4] font-medium rounded-full border border-[#97FCE4]/40 hover:bg-[#24343f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Private send
                </button>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-[#0A1215] p-4">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <h4 className="text-white font-medium">Shielded balances</h4>
                  <PrivacyModeToggle
                    privacySupported={privacySupported}
                    privacyMode={privacyMode}
                    onChange={setPrivacyMode}
                  />
                </div>
                {!privacySupported ? (
                  <p className="text-sm text-gray-500">
                    Install Ready with STRK20 (Wallet API 0.10.3+) to shield WBTC
                    and USDC. Public yield stays available.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Shielded WBTC</p>
                      <p className="text-white font-mono">
                        {readShielded(shieldedBalances, WBTC_ADDRESS)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Shielded USDC</p>
                      <p className="text-white font-mono">
                        {readShielded(shieldedBalances, USDC_ADDRESS)}
                      </p>
                    </div>
                  </div>
                )}
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

      <ShieldModal
        isOpen={isShieldModalOpen}
        onClose={() => setIsShieldModalOpen(false)}
        publicBalances={{ WBTC: wbtcBalance, USDC: usdcPublic }}
        shieldedBalances={{
          WBTC: readShielded(shieldedBalances, WBTC_ADDRESS),
          USDC: readShielded(shieldedBalances, USDC_ADDRESS),
        }}
        onShield={handleShield}
        onUnshield={handleUnshield}
      />

      <PrivateTransferModal
        isOpen={isPrivateTransferOpen}
        onClose={() => setIsPrivateTransferOpen(false)}
        shieldedBalances={{
          WBTC: readShielded(shieldedBalances, WBTC_ADDRESS),
          USDC: readShielded(shieldedBalances, USDC_ADDRESS),
        }}
        onTransfer={handlePrivateTransfer}
      />
    </div>
  );
}
