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
