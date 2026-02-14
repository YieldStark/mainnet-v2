import { useState } from "react";
import { X } from "lucide-react";
import type { VesuPool } from "~/lib/services/vesu";

interface VesuLendModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: VesuPool | null;
  onDeposit: (poolId: string, amount: string) => Promise<void>;
  userBalance: string;
}

export default function VesuLendModal({
  isOpen,
  onClose,
  pool,
  onDeposit,
  userBalance,
}: VesuLendModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !pool) return null;

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > parseFloat(userBalance)) {
      setError("Insufficient balance");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      await onDeposit(pool.id, amount);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(userBalance);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-400";
      case "Medium":
        return "text-yellow-400";
      case "High":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1215] rounded-3xl p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">
            Lend to {pool.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-[#101D22] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Pool APY</span>
              <span className="text-lg font-medium text-[#97FCE4]">
                {pool.apy}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Total Value Locked</span>
              <span className="text-sm text-white">{pool.tvl}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Risk Level</span>
              <span className={`text-sm font-medium ${getRiskColor(pool.riskLevel)}`}>
                {pool.riskLevel}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400">{pool.description}</p>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">
                Amount ({pool.asset})
              </label>
              <span className="text-xs text-gray-500">
                Balance: {userBalance} {pool.asset}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                className="w-full bg-[#101D22] text-white rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-[#97FCE4]"
                step="any"
                min="0"
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#97FCE4] text-sm font-medium hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={isProcessing || !amount}
            className="flex-1 px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
}
