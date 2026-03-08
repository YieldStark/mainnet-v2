import { useState, useEffect } from "react";
import {
  fetchTrovesStrategies,
  getTrovesWbtcUsdcStrategies,
  type TrovesStrategy,
} from "~/lib/services/troves";

// Fallback if API fails (same shape as app.troves.fi/api/strategies)
import strategiesFallback from "~/providers/strategies.json";

const fallbackStrategies = (strategiesFallback as { strategies?: TrovesStrategy[] })
  .strategies ?? [];

export function useTrovesStrategies() {
  const [strategies, setStrategies] = useState<TrovesStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const all = await fetchTrovesStrategies(fallbackStrategies);
        const wbtcUsdc = getTrovesWbtcUsdcStrategies(all);
        if (isMounted) setStrategies(wbtcUsdc);
      } catch (err) {
        console.error("useTrovesStrategies:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load strategies");
          setStrategies(getTrovesWbtcUsdcStrategies(fallbackStrategies));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
  }, []);

  return { strategies, isLoading, error };
}
