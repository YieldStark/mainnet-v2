import type React from 'react'
import { createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

import { type WalletStore, createWalletStore } from '~/stores/wallet-store'

export type WalletStoreApi = ReturnType<typeof createWalletStore>

export const WalletStoreContext = createContext<WalletStoreApi | undefined>(
  undefined
)

export interface WalletStoreProviderProps {
  children: React.ReactNode
}

export const WalletStoreProvider = ({
  children,
}: WalletStoreProviderProps) => {
  const storeRef = useRef<WalletStoreApi | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createWalletStore()
  }

  return (
    <WalletStoreContext.Provider value={storeRef.current}>
      {children}
    </WalletStoreContext.Provider>
  )
}

export const useWalletStore = <T,>(
  selector: (store: WalletStore) => T
): T => {
  const walletStoreContext = useContext(WalletStoreContext)

  if (!walletStoreContext) {
    throw new Error(`useWalletStore must be used within WalletStoreProvider`)
  }

  return useStore(walletStoreContext, selector)
}
