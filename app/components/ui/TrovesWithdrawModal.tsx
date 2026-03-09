import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { getVaultAddress, type TrovesStrategy } from "~/lib/services/troves";

/** Shares use 18 decimals (ERC4626 / ERC20 standard). */
const SHARES_DECIMALS = 18;

/** Format raw shares for input display without Number precision loss. */
function formatSharesToInput(raw: bigint): string {
  if (raw === 0n) return "0";
  const div = 10n ** BigInt(SHARES_DECIMALS);
  const int = raw / div;
  const frac = raw % div;
  const fracStr = frac.toString().padStart(SHARES_DECIMALS, "0").replace(/0+$/, "") || "0";
  return frac === 0n ? int.toString() : `${int}.${fracStr}`;
}

/** Parse input string to raw shares bigint (exact, no float). */
function parseSharesFromInput(value: string): bigint {
  const s = value.trim().replace(/,/g, "");
  if (!s) return 0n;
  const [left = "0", right = "0"] = s.split(".");
  const fracPadded = right.slice(0, SHARES_DECIMALS).padEnd(SHARES_DECIMALS, "0");
  return BigInt(left) * 10n ** BigInt(SHARES_DECIMALS) + BigInt(fracPadded);
}

export interface TrovesPositionForWithdraw {
  strategy: TrovesStrategy;
  shareBalanceRaw: bigint;
  estimatedValueUsd: string;
}

interface TrovesWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: TrovesPositionForWithdraw | null;
  userAddress: string;
  rpcUrl: string;
  onRedeem: (
    strategy: TrovesStrategy,
    vaultAddress: string,
    shares: bigint
  ) => Promise<void>;
}

export default function TrovesWithdrawModal({
  isOpen,
  onClose,
  position,
  onRedeem,
}: TrovesWithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const vaultAddress = position ? getVaultAddress(position.strategy) : null;
  const maxShares = position?.shareBalanceRaw ?? 0n;

  useEffect(() => {
    if (!isOpen || !position) setAmount("");
  }, [isOpen, position]);

  const maxDisplay = maxShares > 0n ? formatSharesToInput(maxShares) : "0";

  const setMax = () => {
    if (maxShares > 0n) setAmount(formatSharesToInput(maxShares));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!position || !vaultAddress) return;
    if (!amount.trim()) {
      toast.error("Enter an amount or click Max");
      return;
    }
    const sharesRaw = parseSharesFromInput(amount);
    if (sharesRaw <= 0n) {
      toast.error("Enter a valid amount");
      return;
    }
    if (sharesRaw > maxShares) {
      toast.error("Amount exceeds your balance");
      return;
    }
    setSubmitting(true);
    try {
      await onRedeem(position.strategy, vaultAddress, sharesRaw);
      onClose();
    } catch (err) {
      // Error already surfaced by parent toast
    } finally {
      setSubmitting(false);
    }
  };

  if (!position) return null;

  const sharesRaw = parseSharesFromInput(amount);
  const isValid = sharesRaw > 0n && sharesRaw <= maxShares;

  const token0 = position.strategy.depositToken?.[0]?.symbol ?? "Token 0";
  const token1 = position.strategy.depositToken?.[1]?.symbol ?? "Token 1";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md bg-[#101D22] rounded-3xl border border-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-medium text-white">
                Redeem — {position.strategy.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="rounded-xl bg-[#0A1215] border border-gray-800 p-3 text-sm">
                <p className="text-gray-400 mb-1">You will receive</p>
                <p className="text-white font-medium">
                  {token0} and {token1}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Amounts depend on current price and position range (as on TrovesFi).
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Position value: {position.estimatedValueUsd}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shares to redeem
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#0A1215] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#97FCE4]/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={setMax}
                    disabled={maxShares <= 0n}
                    className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max redeem: {maxDisplay} shares
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#97FCE4] text-black font-medium hover:bg-[#85E6D1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Redeeming…" : "Redeem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
