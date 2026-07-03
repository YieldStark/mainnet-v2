import { WBTC_ADDRESS, USDC_ADDRESS } from "./Constants";

const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

interface TokenPrices {
  wbtc_usd: number;
  usdc_usd: number;
  strk_usd: number;
}

const FALLBACK_PRICES: TokenPrices = {
  wbtc_usd: 95000,
  usdc_usd: 1,
  strk_usd: 0.5,
};

// Module-level cache so a single swap/deposit doesn't hit CoinGecko 3x, and so a
// slow/rate-limited CoinGecko can't stall the DB write path.
const PRICE_CACHE_TTL_MS = 60_000;
const PRICE_FETCH_TIMEOUT_MS = 4_000;
let cachedPrices: TokenPrices = FALLBACK_PRICES;
let cachedAt = 0;
let inflight: Promise<TokenPrices> | null = null;

async function fetchPricesFromCoinGecko(): Promise<TokenPrices> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PRICE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin,usd-coin,starknet&vs_currencies=usd",
      { signal: controller.signal }
    );
    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }
    const data = await response.json();
    return {
      wbtc_usd: data["wrapped-bitcoin"]?.usd || cachedPrices.wbtc_usd,
      usdc_usd: data["usd-coin"]?.usd || cachedPrices.usdc_usd,
      strk_usd: data["starknet"]?.usd || cachedPrices.strk_usd,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getTokenPrices(): Promise<TokenPrices> {
  const now = Date.now();
  if (now - cachedAt < PRICE_CACHE_TTL_MS) {
    return cachedPrices;
  }
  // De-dupe concurrent refreshes.
  if (!inflight) {
    inflight = fetchPricesFromCoinGecko()
      .then((prices) => {
        cachedPrices = prices;
        cachedAt = Date.now();
        return prices;
      })
      .catch((error) => {
        console.error("Failed to fetch token prices, using cached/fallback:", error);
        // Keep serving the last known (or fallback) prices; don't throw.
        return cachedPrices;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase().replace(/^0x0+/, '0x');
}

export async function convertToUsd(
  tokenAddress: string,
  amountRaw: string,
  decimals: number
): Promise<number> {
  const prices = await getTokenPrices();
  const normalized = normalizeAddress(tokenAddress);
  const wbtcNorm = normalizeAddress(WBTC_ADDRESS);
  const usdcNorm = normalizeAddress(USDC_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return amount * prices.wbtc_usd;
  } else if (normalized === usdcNorm) {
    return amount * prices.usdc_usd;
  } else if (normalized === strkNorm) {
    return amount * prices.strk_usd;
  }
  
  return 0;
}

export async function convertToWbtc(
  tokenAddress: string,
  amountRaw: string,
  decimals: number
): Promise<number> {
  const prices = await getTokenPrices();
  const normalized = normalizeAddress(tokenAddress);
  const wbtcNorm = normalizeAddress(WBTC_ADDRESS);
  const usdcNorm = normalizeAddress(USDC_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return amount;
  } else if (normalized === usdcNorm) {
    return (amount * prices.usdc_usd) / prices.wbtc_usd;
  } else if (normalized === strkNorm) {
    return (amount * prices.strk_usd) / prices.wbtc_usd;
  }
  
  return 0;
}

export async function convertToStrk(
  tokenAddress: string,
  amountRaw: string,
  decimals: number
): Promise<number> {
  const prices = await getTokenPrices();
  const normalized = normalizeAddress(tokenAddress);
  const wbtcNorm = normalizeAddress(WBTC_ADDRESS);
  const usdcNorm = normalizeAddress(USDC_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return (amount * prices.wbtc_usd) / prices.strk_usd;
  } else if (normalized === usdcNorm) {
    return (amount * prices.usdc_usd) / prices.strk_usd;
  } else if (normalized === strkNorm) {
    return amount;
  }
  
  return 0;
}
