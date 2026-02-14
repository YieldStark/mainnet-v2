import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mainnet } from '@starknet-react/chains'
import type { Chain } from '@starknet-react/chains'

export interface NetworkConfig {
  id: string
  name: string
  chain: Chain
  rpcUrl: string
  explorerUrl: string
  isTestnet: boolean
}

const LAVA_RPC_URL = 'https://rpc.starknet.lava.build'
const INFURA_RPC_URL = 'https://starknet-mainnet.infura.io/v3/public'
const DRPC_RPC_URL = 'https://starknet.drpc.org'
const NETHERMIND_RPC_URL = 'https://free-rpc.nethermind.io/mainnet-juno'

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 'mainnet-lava',
    name: 'Starknet Mainnet (Lava)',
    chain: mainnet,
    rpcUrl: LAVA_RPC_URL,
    explorerUrl: 'https://voyager.online',
    isTestnet: false,
  },
  {
    id: 'mainnet-nethermind',
    name: 'Starknet Mainnet (Nethermind)',
    chain: mainnet,
    rpcUrl: NETHERMIND_RPC_URL,
    explorerUrl: 'https://voyager.online',
    isTestnet: false,
  },
  {
    id: 'mainnet-drpc',
    name: 'Starknet Mainnet (dRPC)',
    chain: mainnet,
    rpcUrl: DRPC_RPC_URL,
    explorerUrl: 'https://voyager.online',
    isTestnet: false,
  },
]

interface NetworkStore {
  currentNetwork: NetworkConfig
  setCurrentNetwork: (network: NetworkConfig) => void
  getNetworkById: (id: string) => NetworkConfig | undefined
  isNetworkSupported: (chainId: string) => boolean
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      currentNetwork: SUPPORTED_NETWORKS[0],

      setCurrentNetwork: (network: NetworkConfig) => {
        set({ currentNetwork: network })
      },

      getNetworkById: (id: string) => {
        return SUPPORTED_NETWORKS.find((network) => network.id === id)
      },

      isNetworkSupported: (chainId: string) => {
        return SUPPORTED_NETWORKS.some(
          (network) => network.chain.id.toString() === chainId
        )
      },
    }),
    {
      name: 'network-storage',
      version: 3,
      partialize: (state) => ({ currentNetwork: state.currentNetwork }),
      migrate: (persistedState) => {
        const state = persistedState as { currentNetwork?: NetworkConfig }
        const rpc = state?.currentNetwork?.rpcUrl ?? ''
        const isOldRpc =
          rpc.includes('blastapi.io') ||
          rpc.includes('alchemy.com') ||
          rpc.includes('nethermind.io')
        const isOldMainnetId =
          state?.currentNetwork?.id === 'mainnet' ||
          state?.currentNetwork?.id === 'mainnet-nethermind' ||
          state?.currentNetwork?.id === 'mainnet-blast'
        if (isOldRpc || isOldMainnetId) {
          const mainnetLava = SUPPORTED_NETWORKS[0] // Now Lava RPC
          return {
            ...state,
            currentNetwork: isOldRpc
              ? { ...state.currentNetwork, rpcUrl: LAVA_RPC_URL, id: mainnetLava.id, name: mainnetLava.name }
              : mainnetLava,
          }
        }
        return state
      },
    }
  )
)
