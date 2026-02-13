import type React from 'react'
import { useNetworkStore } from '~/stores/network-store'

interface NetworkStoreProviderProps {
  children: React.ReactNode
}

export function NetworkStoreProvider({ children }: NetworkStoreProviderProps) {
  useNetworkStore.getState()
  return <>{children}</>
}
