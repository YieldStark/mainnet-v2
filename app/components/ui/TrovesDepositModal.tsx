import { useState, useEffect, useRef } from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TrovesStrategy } from "~/lib/services/troves";
import { useWbtcPrice } from "~/hooks/useWbtcPrice";

/** Animated price text: swipes up when price increases, down when it decreases */
function AnimatedPrice({ value, prefix = "" }: { value: number; prefix?: string }) {
  const prevRef = useRef<number | null>(null);
  const directionRef = useRef<"up" | "down">("up");

  if (prevRef.current != null && value !== prevRef.current) {
    directionRef.current = value > prevRef.current ? "up" : "down";
  }
  prevRef.current = value;

  const direction = directionRef.current;
  const text = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ minHeight: "1.25em" }}>
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={value}
          initial={{
            y: direction === "up" ? 16 : -16,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: direction === "up" ? -16 : 16,
            opacity: 0,
          }}
          transition={{
            type: "tween",
            duration: 0.28,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="inline-block"
        >
          {prefix}
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function isStablecoin(symbol: string) {
  return symbol === "USDC" || symbol === "USDC.e";
}

function isWbtc(symbol: string) {
  return symbol === "WBTC";
}

interface TrovesDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: TrovesStrategy | null;
  onDeposit: (
    strategy: TrovesStrategy,
    amount0: string,
    amount1: string
  ) => Promise<void>;
  userBalances: Record<string, string>;
}

export default function TrovesDepositModal({
  isOpen,
  onClose,
  strategy,
  onDeposit,
  userBalances,
}: TrovesDepositModalProps) {
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const { priceUsd: wbtcPriceUsd } = useWbtcPrice(isOpen && !!strategy);

  // Reset amounts when modal closes or strategy changes
  useEffect(() => {
    if (!isOpen) {
      setAmount0("");
      setAmount1("");
      setError("");
    }
  }, [isOpen, strategy?.id]);

  if (!isOpen || !strategy) return null;

  const tokens = strategy.depositToken;
  const token0 = tokens[0];
  const token1 = tokens[1];
  const balance0 = userBalances[token0?.symbol] ?? "0";
  const balance1 = userBalances[token1?.symbol] ?? "0";

  const handleAmount0Change = (value: string) => {
    setAmount0(value);
    if (!wbtcPriceUsd || wbtcPriceUsd <= 0) return;
    const num = parseFloat(value);
    if (value === "" || isNaN(num)) {
      setAmount1("");
      return;
    }
    if (isStablecoin(token0?.symbol ?? "")) {
      // token0 is USDC → compute WBTC
      setAmount1((num / wbtcPriceUsd).toFixed(8));
    } else if (isWbtc(token0?.symbol ?? "")) {
      // token0 is WBTC → compute USDC
      setAmount1((num * wbtcPriceUsd).toFixed(6));
    }
  };

  const handleAmount1Change = (value: string) => {
    setAmount1(value);
    if (!wbtcPriceUsd || wbtcPriceUsd <= 0) return;
    const num = parseFloat(value);
    if (value === "" || isNaN(num)) {
      setAmount0("");
      return;
    }
    if (isStablecoin(token1?.symbol ?? "")) {
      setAmount0((num / wbtcPriceUsd).toFixed(8));
    } else if (isWbtc(token1?.symbol ?? "")) {
      setAmount0((num * wbtcPriceUsd).toFixed(6));
    }
  };

  /** Equal-value deposit: max USD = min of both sides; fraction 0.5 or 1 */
  const applyBalanceFraction = (fraction: number) => {
    if (!wbtcPriceUsd || wbtcPriceUsd <= 0) {
      setError("Price unavailable — try again in a moment");
      return;
    }
    const b0 = parseFloat(balance0) || 0;
    const b1 = parseFloat(balance1) || 0;
    const s0 = token0?.symbol ?? "";
    const s1 = token1?.symbol ?? "";
    const usd0 = isStablecoin(s0) ? b0 : isWbtc(s0) ? b0 * wbtcPriceUsd : 0;
    const usd1 = isStablecoin(s1) ? b1 : isWbtc(s1) ? b1 * wbtcPriceUsd : 0;
    if (usd0 <= 0 || usd1 <= 0) {
      setError("Need balance in both tokens for an equal-value deposit");
      return;
    }
    const maxUsd = Math.min(usd0, usd1);
    const targetUsd = maxUsd * fraction;
    if (targetUsd <= 0) {
      setError("Amount too small");
      return;
    }
    setError("");
    if (isStablecoin(s0) && isWbtc(s1)) {
      setAmount0(targetUsd.toFixed(6));
      setAmount1((targetUsd / wbtcPriceUsd).toFixed(8));
    } else if (isWbtc(s0) && isStablecoin(s1)) {
      setAmount0((targetUsd / wbtcPriceUsd).toFixed(8));
      setAmount1(targetUsd.toFixed(6));
    } else {
      setError("Quick amounts supported for WBTC + USDC pairs");
    }
  };

  const handleSubmit = async () => {
    const a0 = amount0.trim();
    const a1 = amount1.trim();
    if (!a0 || !a1 || parseFloat(a0) <= 0 || parseFloat(a1) <= 0) {
      setError("Enter valid amounts for both tokens");
      return;
    }
    if (parseFloat(a0) > parseFloat(balance0)) {
      setError(`Insufficient ${token0?.symbol} balance`);
      return;
    }
    if (parseFloat(a1) > parseFloat(balance1)) {
      setError(`Insufficient ${token1?.symbol} balance`);
      return;
    }

    setIsProcessing(true);
    setError("");
    try {
      await onDeposit(strategy, a0, a1);
      setAmount0("");
      setAmount1("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#101D22] rounded-3xl border border-gray-800 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium text-white">
            Deposit — {strategy.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#97FCE4]/10 border border-[#97FCE4]/20">
            <Info className="text-[#97FCE4] mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-gray-300">
              Deposit <strong>equal value</strong> of {token0?.symbol} and{" "}
              {token1?.symbol}. Approve both tokens, then deposit.
            </p>
          </div>

          {wbtcPriceUsd != null && (
            <p className="text-xs text-gray-400">
              1 WBTC ≈ $<AnimatedPrice value={wbtcPriceUsd} />
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Quick fill (equal value):</span>
            <button
              type="button"
              onClick={() => applyBalanceFraction(0.5)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-[#97FCE4] hover:border-[#97FCE4]/50 transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => applyBalanceFraction(1)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-[#97FCE4] hover:border-[#97FCE4]/50 transition-colors"
            >
              Max
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {token0?.symbol} amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount0}
              onChange={(e) => handleAmount0Change(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-[#97FCE4]/50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Balance: {balance0} {token0?.symbol}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {token1?.symbol} amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount1}
              onChange={(e) => handleAmount1Change(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-[#97FCE4]/50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Balance: {balance1} {token1?.symbol}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing…" : "Approve & Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
}
