import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { VesuPairCollateralOption, VesuPoolPairSnapshot } from "~/lib/services/vesu";

const SAFE_BORROW_FACTOR = 0.995;
const MIN_COLLATERAL_VALUE_USD_FOR_BORROW = 20;

interface VesuPrimeBorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  pairOptions: VesuPairCollateralOption[];
  selectedCollateral: string;
  onSelectCollateral: (collateralAddress: string) => void;
  collateralBalance: string;
  currentBorrowApr: string;
  currentSupplyApr?: string;
  debtSymbol?: string;
  pairStats?: VesuPoolPairSnapshot;
  existingCollateralAmount?: number;
  existingDebtAmount?: number;
  collateralPriceUsd?: number;
  debtPriceUsd?: number;
  onSubmit: (collateralAmount: string, borrowAmount: string) => Promise<void>;
}

export default function VesuPrimeBorrowModal({
  isOpen,
  onClose,
  title = "Vesu Prime Borrow WBTC",
  pairOptions,
  selectedCollateral,
  onSelectCollateral,
  collateralBalance,
  currentBorrowApr,
  currentSupplyApr,
  debtSymbol = "WBTC",
  pairStats,
  existingCollateralAmount = 0,
  existingDebtAmount = 0,
  collateralPriceUsd = 0,
  debtPriceUsd = 0,
  onSubmit,
}: VesuPrimeBorrowModalProps) {
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const selectedOption = useMemo(
    () => pairOptions.find((p) => p.address.toLowerCase() === selectedCollateral.toLowerCase()),
    [pairOptions, selectedCollateral]
  );

  const enteredCollateral = parseFloat(collateralAmount || "0") || 0;
  const enteredBorrow = parseFloat(borrowAmount || "0") || 0;
  const maxLtv = pairStats?.maxLtv || 0;
  const liquidationLtv = pairStats?.liquidationLtv || 0;
  const nextCollateral = Math.max(0, existingCollateralAmount + enteredCollateral);
  const nextDebt = Math.max(0, existingDebtAmount + enteredBorrow);
  const maxDebtValueUsd = nextCollateral * collateralPriceUsd * maxLtv;
  const currentDebtValueUsd = existingDebtAmount * debtPriceUsd;
  const additionalBorrowValueUsd = Math.max(0, maxDebtValueUsd - currentDebtValueUsd);
  const maxBorrowableDebt = debtPriceUsd > 0 ? additionalBorrowValueUsd / debtPriceUsd : 0;
  const safeMaxBorrowableDebt = Math.max(0, maxBorrowableDebt * SAFE_BORROW_FACTOR);
  const safeMaxLtv = Math.max(0, maxLtv * SAFE_BORROW_FACTOR);
  const nextDebtAfterInput = Math.max(0, existingDebtAmount + enteredBorrow);
  const requiredTotalCollateralForBorrow =
    enteredBorrow > 0 && collateralPriceUsd > 0 && debtPriceUsd > 0 && safeMaxLtv > 0
      ? (nextDebtAfterInput * debtPriceUsd) / (collateralPriceUsd * safeMaxLtv)
      : 0;
  const minAdditionalCollateralNeeded = Math.max(
    0,
    requiredTotalCollateralForBorrow - existingCollateralAmount
  );
  const projectedLtv =
    nextCollateral > 0 && collateralPriceUsd > 0
      ? (nextDebt * debtPriceUsd) / (nextCollateral * collateralPriceUsd)
      : 0;
  const projectedLtvPercent = projectedLtv * 100;
  const maxLtvPercent = maxLtv * 100;
  const progressPercent =
    maxLtvPercent > 0 ? Math.min(100, (projectedLtvPercent / maxLtvPercent) * 100) : 0;

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const collateral = parseFloat(collateralAmount || "0");
    const borrow = parseFloat(borrowAmount || "0");
    if (collateral <= 0 && borrow <= 0) {
      setError("Enter collateral and/or borrow amount");
      return;
    }
    if (collateral > parseFloat(collateralBalance || "0")) {
      setError(`Insufficient ${selectedOption?.symbol || "collateral"} balance`);
      return;
    }
    if (borrow > 0 && safeMaxBorrowableDebt > 0 && borrow > safeMaxBorrowableDebt) {
      setError(
        `Borrow amount is too close to max LTV. Try ${safeMaxBorrowableDebt.toFixed(8)} ${debtSymbol} or less.`
      );
      return;
    }
    const projectedCollateralValueUsd = nextCollateral * collateralPriceUsd;
    if (
      borrow > 0 &&
      collateralPriceUsd > 0 &&
      projectedCollateralValueUsd < MIN_COLLATERAL_VALUE_USD_FOR_BORROW
    ) {
      setError(
        `Collateral is too small for borrowing. Supply at least ~$${MIN_COLLATERAL_VALUE_USD_FOR_BORROW.toFixed(0)} of ${selectedOption?.symbol || "collateral"}.`
      );
      return;
    }
    setError("");
    setIsProcessing(true);
    try {
      await onSubmit(collateralAmount || "0", borrowAmount || "0");
      setCollateralAmount("");
      setBorrowAmount("");
      onClose();
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Borrow transaction failed";
      if (rawMessage.includes("dusty-collateral-balance")) {
        setError(
          `Borrow reverted: collateral would be too small ("dusty"). Increase collateral amount and/or reduce borrow size.`
        );
      } else {
        setError(rawMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#0A1215] p-6">
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

        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-400">Select collateral pair</label>
          <select
            value={selectedCollateral}
            onChange={(e) => onSelectCollateral(e.target.value)}
            className="w-full rounded-xl bg-[#101D22] px-4 py-3 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
          >
            {pairOptions.map((option) => (
              <option key={option.address} value={option.address}>
                {option.symbol} / {debtSymbol}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 space-y-3 rounded-2xl bg-[#101D22] p-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-400">Borrow APR</div>
              <div className="text-[#97FCE4]">{currentBorrowApr}</div>
            </div>
            {currentSupplyApr != null && currentSupplyApr !== "" ? (
              <div>
                <div className="text-gray-400">Supply APR</div>
                <div className="text-[#97FCE4]">{currentSupplyApr}</div>
              </div>
            ) : (
              <div />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-400">Max LTV</div>
              <div className="text-white">{(maxLtv * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-gray-400">Liquidation LTV</div>
              <div className="text-white">{(liquidationLtv * 100).toFixed(2)}%</div>
            </div>
          </div>
          <div>
            <div className="text-gray-400">Liquidation Bonus</div>
            <div className="text-white">{(pairStats?.liquidationBonus || 0).toFixed(2)}%</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label className="text-gray-400">Supply collateral ({selectedOption?.symbol})</label>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Balance: {collateralBalance}</span>
                <button
                  type="button"
                  onClick={() => setCollateralAmount(minAdditionalCollateralNeeded.toFixed(8))}
                  className="rounded-full border border-[#97FCE4]/60 bg-[#97FCE4]/10 px-3 py-1.5 text-sm font-semibold text-[#97FCE4] transition-colors hover:bg-[#97FCE4]/20 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={enteredBorrow <= 0 || minAdditionalCollateralNeeded <= 0}
                  title="Set minimum collateral for current borrow"
                >
                  Use min
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-[#101D22] px-4 py-3 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
            />
            {enteredBorrow > 0 && (
              <p className="mt-2 text-xs text-gray-400">
                Min collateral needed (safe):{" "}
                <span className="text-[#97FCE4]">
                  {minAdditionalCollateralNeeded.toFixed(8)} {selectedOption?.symbol || "asset"}
                </span>
              </p>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label className="text-gray-400">Borrow {debtSymbol}</label>
              <button
                type="button"
                onClick={() => setBorrowAmount(safeMaxBorrowableDebt.toFixed(8))}
                className="rounded-full border border-[#97FCE4]/60 bg-[#97FCE4]/10 px-3 py-1.5 text-sm font-semibold text-[#97FCE4] transition-colors hover:bg-[#97FCE4]/20"
              >
                Use max
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-[#101D22] px-4 py-3 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
            />
            <p className="mt-2 text-xs text-gray-400">
              Max borrowable now (safe):{" "}
              <span className="text-[#97FCE4]">
                {safeMaxBorrowableDebt.toFixed(8)} {debtSymbol}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#101D22] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-[#6f84ff]">LOAN TO VALUE</span>
            <span
              className={`text-xl font-semibold leading-none ${
                projectedLtvPercent > maxLtvPercent * 0.95 ? "text-red-400" : "text-gray-300"
              }`}
            >
              {projectedLtvPercent.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200/20">
            <div
              className={`h-2 rounded-full transition-all ${
                projectedLtvPercent > maxLtvPercent * 0.95 ? "bg-red-500" : "bg-[#97FCE4]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 text-right text-base leading-none text-gray-400">
            Max. {maxLtvPercent.toFixed(2)}%
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
            {isProcessing ? "Processing..." : "Supply & Borrow"}
          </button>
        </div>
      </div>
    </div>
  );
}
