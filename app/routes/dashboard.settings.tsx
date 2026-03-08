import { useState } from "react";
import { disconnect } from "@starknet-io/get-starknet";
import { Copy, LogOut } from "lucide-react";
import { useWalletStore } from "~/providers/wallet-store-provider";

export default function SettingsPage() {
  const { vaultAddress, isConnected, disconnectWallet } = useWalletStore(
    (state) => state
  );
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (!vaultAddress) return;
    try {
      await navigator.clipboard.writeText(vaultAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      disconnectWallet();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#101D22] rounded-4xl p-6">
        <h1 className="text-3xl font-medium text-white">Settings</h1>
        <p className="text-gray-400">
          Manage your wallet and account preferences
        </p>
      </div>

      <div className="bg-[#101D22] rounded-4xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Connected wallet</h2>
        {!isConnected || !vaultAddress ? (
          <p className="text-gray-400">
            Connect your wallet to see your address here.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <code className="text-sm text-gray-300 font-mono bg-[#0A1215] px-4 py-2 rounded-xl border border-gray-800 truncate max-w-[280px] sm:max-w-none">
                {formatAddress(vaultAddress)}
              </code>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="p-2 rounded-lg bg-[#0A1215] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors shrink-0"
                title="Copy full address"
              >
                <Copy size={18} />
              </button>
              {copied && (
                <span className="text-xs text-[#97FCE4]">Copied</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-medium hover:bg-red-500/20 transition-colors shrink-0"
            >
              <LogOut size={18} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
