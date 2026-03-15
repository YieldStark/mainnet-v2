import { WBTC_ADDRESS, USDC_ADDRESS } from "./Constants";

const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const USDC_E_ADDRESS = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

export async function getTokenPrices(): Promise<{
  wbtc_usd: number;
  usdc_usd: number;
  strk_usd: number;
}> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin,usd-coin,starknet&vs_currencies=usd');
    const data = await response.json();
    
    return {
      wbtc_usd: data['wrapped-bitcoin']?.usd || 95000,
      usdc_usd: data['usd-coin']?.usd || 1,
      strk_usd: data['starknet']?.usd || 0.5
    };
  } catch (error) {
    console.error('Failed to fetch token prices:', error);
    return {
      wbtc_usd: 95000,
      usdc_usd: 1,
      strk_usd: 0.5
    };
  }
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
  const usdcENorm = normalizeAddress(USDC_E_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return amount * prices.wbtc_usd;
  } else if (normalized === usdcNorm || normalized === usdcENorm) {
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
  const usdcENorm = normalizeAddress(USDC_E_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return amount;
  } else if (normalized === usdcNorm || normalized === usdcENorm) {
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
  const usdcENorm = normalizeAddress(USDC_E_ADDRESS);
  const strkNorm = normalizeAddress(STRK_ADDRESS);
  
  const amount = Number(amountRaw) / (10 ** decimals);
  
  if (normalized === wbtcNorm) {
    return (amount * prices.wbtc_usd) / prices.strk_usd;
  } else if (normalized === usdcNorm || normalized === usdcENorm) {
    return (amount * prices.usdc_usd) / prices.strk_usd;
  } else if (normalized === strkNorm) {
    return amount;
  }
  
  return 0;
}
