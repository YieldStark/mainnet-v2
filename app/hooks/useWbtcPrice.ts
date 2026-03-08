import { useState, useEffect } from "react";

const COINGECKO_WBTC_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=usd";

const POLL_INTERVAL_MS = 1_000; // refetch every 3s so price can animate on change

/**
 * Fetches current WBTC price in USD from CoinGecko (no API key required).
 * When pollIntervalMs is set, refetches so the price can update and animate.
 */
export function useWbtcPrice(enabled = true, pollIntervalMs = POLL_INTERVAL_MS) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setPriceUsd(null);
    setError(null);
    setIsLoading(true);

    const fetchPrice = (isInitial: boolean) => {
      fetch(COINGECKO_WBTC_URL)
        .then((res) => res.json())
        .then((data: { "wrapped-bitcoin"?: { usd?: number } }) => {
          if (cancelled) return;
          const usd = data["wrapped-bitcoin"]?.usd;
          if (typeof usd === "number" && usd > 0) {
            setPriceUsd(usd);
          } else if (isInitial) {
            setError("Invalid price response");
          }
        })
        .catch((err) => {
          if (!cancelled && isInitial) {
            setError(err instanceof Error ? err.message : "Failed to fetch price");
          }
        })
        .finally(() => {
          if (!cancelled && isInitial) setIsLoading(false);
        });
    };

    fetchPrice(true);
    const interval =
      pollIntervalMs > 0
        ? setInterval(() => fetchPrice(false), pollIntervalMs)
        : undefined;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [enabled]);

  return { priceUsd, isLoading, error };
}
