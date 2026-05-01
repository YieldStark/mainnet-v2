import { useState } from "react";
import { X } from "lucide-react";

interface VesuLoanManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "repay" | "withdraw";
  onSubmit: (amount: string) => Promise<void>;
  maxAmount: string;
  assetSymbol: string;
}

export default function VesuLoanManageModal({
  isOpen,
  onClose,
  mode,
  onSubmit,
  maxAmount,
  assetSymbol,
}: VesuLoanManageModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const title = mode === "repay" ? "Repay Debt" : "Withdraw Collateral";

  const handleMax = () => setAmount(maxAmount);

  const handleSubmit = async () => {
    const value = parseFloat(amount || "0");
    if (value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (value > parseFloat(maxAmount || "0")) {
      setError(`Amount exceeds max available ${assetSymbol}`);
      return;
    }

    setError("");
    setIsProcessing(true);
    try {
      await onSubmit(amount);
      setAmount("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-[#0A1215] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            disabled={isProcessing}
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="mb-2 flex items-center justify-between text-sm">
            <label className="text-gray-400">Amount ({assetSymbol})</label>
            <span className="text-gray-500">Max: {maxAmount}</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-[#101D22] px-4 py-3 pr-16 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
            />
            <button
              onClick={handleMax}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#97FCE4] hover:underline"
              type="button"
            >
              MAX
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-gray-800 px-6 py-3 text-white transition-colors hover:bg-gray-700"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 rounded-full bg-[#97FCE4] px-6 py-3 font-medium text-black transition-colors hover:bg-[#85E6D1] disabled:opacity-60"
            type="button"
          >
            {isProcessing ? "Processing..." : mode === "repay" ? "Repay" : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
