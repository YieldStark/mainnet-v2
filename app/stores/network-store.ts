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

const DRPC_RPC_URL = 'https://starknet.drpc.org'
const NETHERMIND_RPC_URL = 'https://free-rpc.nethermind.io/mainnet-juno'

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    id: 'mainnet-drpc',
    name: 'Starknet Mainnet (dRPC)',
    chain: mainnet,
    rpcUrl: DRPC_RPC_URL,
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
      version: 1,
      partialize: (state) => ({ currentNetwork: state.currentNetwork }),
      migrate: (persistedState) => {
        const state = persistedState as { currentNetwork?: NetworkConfig }
        const rpc = state?.currentNetwork?.rpcUrl ?? ''
        const isOldRpc =
          rpc.includes('blastapi') ||
          rpc.includes('alchemy.com')
        const isOldMainnetId =
          state?.currentNetwork?.id === 'mainnet'
        if (isOldRpc || isOldMainnetId) {
          const mainnetDrpc = SUPPORTED_NETWORKS[0]
          return {
            ...state,
            currentNetwork: isOldRpc
              ? { ...state.currentNetwork, rpcUrl: DRPC_RPC_URL, id: mainnetDrpc.id, name: mainnetDrpc.name }
              : mainnetDrpc,
          }
        }
        return state
      },
    }
  )
)
