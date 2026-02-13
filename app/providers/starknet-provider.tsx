import type React from 'react'
import {
  StarknetConfig,
  publicProvider,
  useInjectedConnectors,
  ready,
  braavos,
} from '@starknet-react/core'
import { mainnet } from '@starknet-react/chains'

interface StarknetProviderProps {
  children: React.ReactNode
}

function StarknetProviderInner({ children }: StarknetProviderProps) {
  const { connectors } = useInjectedConnectors({
    recommended: [ready(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
    order: 'random',
  })

  const chains = [mainnet]
  const provider = publicProvider()

  return (
    <StarknetConfig
      chains={chains}
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
