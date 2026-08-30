import type React from 'react'
import {
  StarknetConfig,
  jsonRpcProvider,
  useInjectedConnectors,
  ready,
  braavos,
} from '@starknet-react/core'
import { mainnet } from '@starknet-react/chains'
import { rpcProviderOptions } from '~/lib/utils/rpcProvider'
import { useNetworkStore } from '~/stores/network-store'

interface StarknetProviderProps {
  children: React.ReactNode
}

function StarknetProviderInner({ children }: StarknetProviderProps) {
  const { connectors } = useInjectedConnectors({
    recommended: [ready(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
    order: 'random',
  })

  const rpcUrl = useNetworkStore((s) => s.currentNetwork.rpcUrl)

  // Do not use publicProvider() — it hardcodes specVersion 0.8.1, which
  // starknet.js 10 rejects.
  const provider = jsonRpcProvider({
    rpc: () => rpcProviderOptions(rpcUrl),
  })

  return (
    <StarknetConfig
      chains={[mainnet]}
      provider={provider}
      connectors={connectors}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  )
}

export default function StarknetProvider({ children }: StarknetProviderProps) {
  return <StarknetProviderInner>{children}</StarknetProviderInner>
}
