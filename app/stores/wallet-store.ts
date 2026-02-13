import { createStore } from 'zustand/vanilla'
import { fetchWbtcBalance } from '~/lib/utils/fetchWbtcBalance'

interface WalletAccount {
  address: string
  account?: {
    address: string
  }
}

export type WalletState = {
  wallet: WalletAccount | null
  isConnected: boolean
  vaultAddress: string
  totalBalance: number
  vesuBalance: number
  ekuboBalance: number
  agentROI: number
}

export type WalletActions = {
  connectWallet: (walletAccount?: WalletAccount) => Promise<void>
  disconnectWallet: () => void
  updateBalances: (rpcUrl?: string) => Promise<void>
  setVaultAddress: (address: string) => void
  setTotalBalance: (balance: number) => void
}

export type WalletStore = WalletState & WalletActions

export const defaultInitState: WalletState = {
  wallet: null,
  isConnected: false,
  vaultAddress: '',
  totalBalance: 0,
  vesuBalance: 0,
  ekuboBalance: 0,
  agentROI: 0,
}

export const createWalletStore = (
  initState: WalletState = defaultInitState
) => {
  return createStore<WalletStore>()((set, get) => ({
    ...initState,
    connectWallet: async (walletAccount?: WalletAccount) => {
      try {
        let address = ''

        if (walletAccount) {
          address =
            walletAccount?.account?.address || walletAccount?.address || ''
        }

        set({
          isConnected: true,
          wallet: walletAccount || get().wallet,
          vaultAddress: address,
        })
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      }
    },
    disconnectWallet: () => {
      set({
        wallet: null,
        isConnected: false,
        totalBalance: 0,
        vesuBalance: 0,
        ekuboBalance: 0,
      })
    },
    updateBalances: async (rpcUrl?: string) => {
      try {
        const { vaultAddress } = get()
        if (rpcUrl && vaultAddress) {
          const balance = await fetchWbtcBalance(rpcUrl, vaultAddress)
          set({ totalBalance: balance })
        }
      } catch (error) {
        console.error('Failed to update balances:', error)
      }
    },
    setVaultAddress: (address: string) => {
      set({ vaultAddress: address })
    },
    setTotalBalance: (balance: number) => {
      set({ totalBalance: balance })
    },
  }))
}
