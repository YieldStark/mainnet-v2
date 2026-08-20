import { createStore } from 'zustand/vanilla'
import { fetchWbtcBalance } from '~/lib/utils/fetchWbtcBalance'
import {
  getShieldedBalanceMap,
  isStrk20Wallet,
  privateLendPools,
  probePrivacySupport,
  type ShieldedBalanceMap,
} from '~/lib/services/strk20'
import { USDC_ADDRESS, WBTC_ADDRESS } from '~/lib/utils/Constants'

interface ConnectedWallet {
  address: string
  account?: {
    address: string
  }
}

export type WalletState = {
  wallet: ConnectedWallet | null
  isConnected: boolean
  vaultAddress: string
  totalBalance: number
  vesuBalance: number
  ekuboBalance: number
  agentROI: number
  privacySupported: boolean
  privacyMode: boolean
  shieldedBalances: ShieldedBalanceMap
}

export type WalletActions = {
  connectWallet: (walletAccount?: ConnectedWallet) => Promise<void>
  disconnectWallet: () => void
  updateBalances: (rpcUrl?: string) => Promise<void>
  setVaultAddress: (address: string) => void
  setTotalBalance: (balance: number) => void
  setPrivacyMode: (enabled: boolean) => void
  refreshShieldedBalances: () => Promise<void>
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
  privacySupported: false,
  privacyMode: false,
  shieldedBalances: {},
}

function tokenDecimalsMap(): Record<string, number> {
  const map: Record<string, number> = {
    [WBTC_ADDRESS]: 8,
    [USDC_ADDRESS]: 6,
  }
  for (const pool of privateLendPools()) {
    map[pool.vTokenAddress] = pool.decimals
  }
  return map
}

export const createWalletStore = (
  initState: WalletState = defaultInitState
) => {
  return createStore<WalletStore>()((set, get) => ({
    ...initState,
    connectWallet: async (walletAccount?: ConnectedWallet) => {
      try {
        let address = ''

        if (walletAccount) {
          address =
            walletAccount?.account?.address || walletAccount?.address || ''
        }

        const privacySupported = walletAccount
          ? await probePrivacySupport(walletAccount)
          : isStrk20Wallet(get().wallet)

        set({
          isConnected: true,
          wallet: walletAccount || get().wallet,
          vaultAddress: address,
          privacySupported,
          privacyMode: privacySupported ? get().privacyMode : false,
        })

        if (privacySupported) {
          await get().refreshShieldedBalances()
        }
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
        privacySupported: false,
        privacyMode: false,
        shieldedBalances: {},
      })
    },
    updateBalances: async (rpcUrl?: string) => {
      try {
        const { vaultAddress } = get()
        if (rpcUrl && vaultAddress) {
          const balance = await fetchWbtcBalance(rpcUrl, vaultAddress)
          set({ totalBalance: balance })
        }
        if (get().privacySupported) {
          await get().refreshShieldedBalances()
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
    setPrivacyMode: (enabled: boolean) => {
      const { privacySupported } = get()
      set({ privacyMode: enabled && privacySupported })
    },
    refreshShieldedBalances: async () => {
      const { wallet, privacySupported } = get()
      if (!privacySupported || !wallet) {
        set({ shieldedBalances: {} })
        return
      }
      try {
        const shieldedBalances = await getShieldedBalanceMap(
          wallet,
          tokenDecimalsMap()
        )
        set({ shieldedBalances })
      } catch (error) {
        console.error('Failed to fetch shielded balances:', error)
      }
    },
  }))
}
