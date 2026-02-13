// Default mainnet RPC: dRPC (use network store for switching dRPC / Nethermind)
const getMainnetRpcUrl = () => 'https://starknet.drpc.org'

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
