import { useState, useEffect } from 'react'
import { useAccount } from '@starknet-react/core'
import { useWalletStore } from '~/providers/wallet-store-provider'
import { Loader2 } from 'lucide-react'

const AgentPerformance = () => {
  const { address } = useAccount()
  const wallet = useWalletStore((state) => state.wallet)
  const userAddress = address || wallet?.address

  const vesuBalance = useWalletStore((state) => state.vesuBalance)
  const ekuboBalance = useWalletStore((state) => state.ekuboBalance)
  const agentROI = useWalletStore((state) => state.agentROI)

  // TODO: Fetch actual APY values from protocols
  const [vesuAPY, setVesuAPY] = useState('0')
  const [ekuboAPY, setEkuboAPY] = useState('0')

  useEffect(() => {
    // TODO: Fetch APY from protocol APIs
    // Placeholder for actual data fetching
  }, [])

  return (
    <div className="bg-[#101D22] rounded-lg p-6">
      {/* Content removed */}
    </div>
  )
}

export default AgentPerformance
