// Available Mainnet RPC Providers
export const RPC_PROVIDERS = {
  LAVA: 'https://rpc.starknet.lava.build',
  INFURA: 'https://starknet-mainnet.infura.io/v3/public',
  DRPC: 'https://starknet.drpc.org',
  NETHERMIND: 'https://free-rpc.nethermind.io/mainnet-juno',
  BLAST: 'https://starknet-mainnet.public.blastapi.io', // DEPRECATED: Service shut down
  ALCHEMY: 'https://starknet-mainnet.g.alchemy.com/v2/demo', // Replace 'demo' with your API key
} as const;

// Default mainnet RPC: Lava (fast public endpoint)
const getMainnetRpcUrl = () => RPC_PROVIDERS.LAVA;

// Starknet Configuration - This will be dynamically set based on network selection
export const STARKNET_CONFIG = {
  RPC_URL: getMainnetRpcUrl(),
  CHAIN_ID: '0x534e5f4d41494e', // Starknet Mainnet
  EXPLORER_URL: 'https://voyager.online',
}

// STRK20 privacy pool (mainnet). Wallet API 0.10.3 — keys stay in Ready.
export const STRK20_CONFIG = {
  POOL_ADDRESS:
    "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a",
  VESU_LENDING_HELPER:
    "0x028b49bc7a48b92d06d436d90e889729d7161dfc2fef3f16b674029bf7abc336",
  MIN_WALLET_API: "0.10.3",
} as const

// App Configuration
export const APP_CONFIG = {
  VAULT_ADDRESS: '', // TODO: Set mainnet vault address
  SUPPORTED_TOKENS: ['wbtc', 'eth', 'usdc'],
  PROTOCOLS: {
    VESU: {
      name: 'Vesu',
      color: '#97FCE4',
    },
    EKUBO: {
      name: 'Ekubo',
      color: '#8B5CF6',
    },
  },
}

// AVNU API Configuration
export const AVNU_CONFIG = {
  API_URL: 'https://api.avnu.fi',
  MAINNET_CHAIN_ID: 'SN_MAIN',
}

// Layerswap Bridge Configuration (non-custodial bridge into/out of Starknet)
export const BRIDGE_CONFIG = {
  // API keys from https://layerswap.io/dashboard to track swaps under this app
  LAYERSWAP_API_KEY_MAINNET:
    import.meta.env.VITE_LAYERSWAP_API_KEY_MAINNET ||
    import.meta.env.VITE_LAYERSWAP_API_KEY ||
    '',
  LAYERSWAP_API_KEY_TESTNET: import.meta.env.VITE_LAYERSWAP_API_KEY_TESTNET || '',
  // Required by the Layerswap widget's EVM/Starknet wallet connectors
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
}
