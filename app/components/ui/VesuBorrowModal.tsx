import { useState } from "react";
import { X } from "lucide-react";

// Keep borrow "max" below the hard max-LTV so oracle movement/rounding
// doesn't trigger Vesu's `not-collateralized` revert.
const SAFE_BORROW_FACTOR = 0.95;
// Vesu rejects any non-zero debt at/below the pool's debt floor
// ("dusty-debt-balance"). Require borrowing a bit above the floor.
const DEBT_FLOOR_FALLBACK_USD = 10;
const DEBT_FLOOR_BUFFER = 1.1;

interface VesuBorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collateralAmount: string, borrowAmount: string) => Promise<void>;
  collateralBalance: string;
  title?: string;
  collateralSymbol?: string;
  debtSymbol?: string;
  debtDecimals?: number;
  borrowApr: string;
  supplyApr: string;
  utilization?: string;
  existingCollateralAmount?: number;
  existingDebtAmount?: number;
  collateralPriceUsd?: number;
  debtPriceUsd?: number;
  maxLtv?: number;
  debtFloorUsd?: number;
}

export default function VesuBorrowModal({
  isOpen,
  onClose,
  onSubmit,
  collateralBalance,
  title = "Borrow USDC with WBTC",
  collateralSymbol = "WBTC",
  debtSymbol = "USDC",
  debtDecimals = 6,
  borrowApr,
  supplyApr,
  utilization,
  existingCollateralAmount = 0,
  existingDebtAmount = 0,
  collateralPriceUsd = 0,
  debtPriceUsd = 0,
  maxLtv = 0,
  debtFloorUsd,
}: VesuBorrowModalProps) {
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const enteredCollateral = parseFloat(collateralAmount || "0") || 0;
  const enteredBorrow = parseFloat(borrowAmount || "0") || 0;
  const nextCollateral = Math.max(0, existingCollateralAmount + enteredCollateral);
  const nextDebt = Math.max(0, existingDebtAmount + enteredBorrow);
  const maxDebtValueUsd = nextCollateral * collateralPriceUsd * maxLtv;
  const currentDebtValueUsd = existingDebtAmount * debtPriceUsd;
  const additionalBorrowValueUsd = Math.max(0, maxDebtValueUsd - currentDebtValueUsd);
  const maxBorrowableDebt =
    debtPriceUsd > 0
      ? Math.max(0, (additionalBorrowValueUsd / debtPriceUsd) * SAFE_BORROW_FACTOR)
      : 0;
  const effectiveDebtFloorUsd =
    debtFloorUsd && debtFloorUsd > 0 ? debtFloorUsd : DEBT_FLOOR_FALLBACK_USD;
  const minBorrowForFloor =
    debtPriceUsd > 0 ? (effectiveDebtFloorUsd * DEBT_FLOOR_BUFFER) / debtPriceUsd : 0;
  const projectedLtv =
    nextCollateral > 0 && collateralPriceUsd > 0
      ? (nextDebt * debtPriceUsd) / (nextCollateral * collateralPriceUsd)
      : 0;
  const projectedLtvPercent = Math.max(0, projectedLtv * 100);
  const maxLtvPercent = Math.max(0, maxLtv * 100);
  const progressPercent =
    maxLtvPercent > 0 ? Math.min(100, (projectedLtvPercent / maxLtvPercent) * 100) : 0;

  const handleMaxCollateral = () => setCollateralAmount(collateralBalance);
  const handleUseMaxBorrow = () => setBorrowAmount(maxBorrowableDebt.toFixed(debtDecimals));

  const handleSubmit = async () => {
    const collateral = parseFloat(collateralAmount || "0");
    const borrow = parseFloat(borrowAmount || "0");

    if (collateral <= 0 && borrow <= 0) {
      setError("Enter collateral and/or borrow amount");
      return;
    }

    if (collateral > parseFloat(collateralBalance || "0")) {
      setError(`Insufficient ${collateralSymbol} balance`);
      return;
    }

    if (
      borrow > 0 &&
      debtPriceUsd > 0 &&
      nextDebt * debtPriceUsd <= effectiveDebtFloorUsd * DEBT_FLOOR_BUFFER
    ) {
      setError(
        `Borrow amount is too small. Vesu requires a debt above ~$${effectiveDebtFloorUsd.toFixed(0)}. Borrow at least ${minBorrowForFloor.toFixed(debtDecimals)} ${debtSymbol}.`
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
      if (rawMessage.includes("dusty-debt-balance")) {
        setError(
          `Borrow reverted: the borrow amount is too small ("dusty"). Vesu requires a minimum debt size — increase the borrow amount and try again.`
        );
      } else if (rawMessage.includes("dusty-collateral-balance")) {
        setError(
          `Borrow reverted: collateral would be too small ("dusty"). Increase collateral amount and/or reduce borrow size.`
        );
      } else if (rawMessage.includes("not-collateralized")) {
        setError(
          `Borrow reverted: not enough collateral for this borrow amount (over max LTV). Reduce the borrow amount or supply more collateral.`
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

        <div className="mb-5 space-y-2 rounded-2xl bg-[#101D22] p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Supply APR</span>
            <span className="text-[#97FCE4]">{supplyApr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Borrow APR</span>
            <span className="text-[#97FCE4]">{borrowApr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Utilization</span>
            <span className="text-white">{utilization || "—"}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label className="text-gray-400">Supply {collateralSymbol} (Collateral)</label>
              <span className="text-gray-500">
                Balance: {collateralBalance} {collateralSymbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#101D22] px-4 py-3 pr-16 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
              />
              <button
                onClick={handleMaxCollateral}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#97FCE4] hover:underline"
                type="button"
              >
                MAX
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">Borrow {debtSymbol} (Debt)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#101D22] px-4 py-3 pr-16 text-white outline-none ring-0 focus:ring-2 focus:ring-[#97FCE4]"
              />
              <button
                onClick={handleUseMaxBorrow}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#97FCE4] hover:underline"
                type="button"
              >
                MAX
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Max borrowable now:{" "}
              <span className="text-[#97FCE4]">
                {maxBorrowableDebt.toFixed(debtDecimals)} {debtSymbol}
              </span>
            </p>
            {minBorrowForFloor > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Min borrow (~${effectiveDebtFloorUsd.toFixed(0)} floor):{" "}
                <span className="text-[#97FCE4]">
                  {minBorrowForFloor.toFixed(debtDecimals)} {debtSymbol}
                </span>
              </p>
            )}
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
