/** Mainnet RPCs: dRPC and Nethermind only */
export const MAINNET_RPC = {
  DRPC: 'https://starknet.drpc.org',
  NETHERMIND: 'https://free-rpc.nethermind.io/mainnet-juno',
} as const

/**
 * Get RPC URL for Starknet networks.
 * Mainnet: dRPC or Nethermind only (use network store to switch).
 */
export const getRpcUrl = (network: 'mainnet' | 'sepolia'): string => {
  if (network === 'mainnet') {
    return MAINNET_RPC.DRPC
  }
  return 'https://starknet-sepolia-rpc.publicnode.com'
}

export const getSepoliaFallbackRPCs = (): string[] => {
  return [
    'https://starknet-sepolia-rpc.publicnode.com',
    'https://starknet-sepolia.drpc.org',
  ]
}
