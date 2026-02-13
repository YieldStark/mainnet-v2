import React, { useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useNetworkStore, SUPPORTED_NETWORKS } from '~/stores/network-store'
import { useSwitchChain } from '@starknet-react/core'

interface NetworkSelectorProps {
  className?: string
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { currentNetwork, setCurrentNetwork } = useNetworkStore()
  const { switchChain } = useSwitchChain({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (isOpen && !target.closest('.network-selector')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNetworkSelect = async (network: typeof SUPPORTED_NETWORKS[0]) => {
    try {
      // Switch chain using Starknet React
      if (switchChain) {
        await switchChain({ chainId: network.chain.id.toString() })
      }
      
      // Update our store
      setCurrentNetwork(network)
      
      console.log('Switched to network:', network.name)
    } catch (error) {
      console.error('Failed to switch network:', error)
    } finally {
      setIsOpen(false)
    }
  }

  // Hide dropdown if only one network is available
  if (SUPPORTED_NETWORKS.length === 1) {
    return (
      <div className={`flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 bg-[#101D22] text-white rounded-full border border-gray-700 ${className}`}>
        <div className="w-4 lg:w-5 h-4 lg:h-5 rounded-full flex items-center justify-center">
          <img
            src="/supported_chains/starknet.png"
            alt="Starknet"
            width={20}
            height={20}
            className="rounded-full"
          />
        </div>
        <span className="text-sm lg:text-base font-medium hidden sm:block">
          {currentNetwork.name}
        </span>
      </div>
    )
  }

  return (
    <div className={`relative network-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3 bg-[#101D22] text-white rounded-full border border-gray-700 hover:border-gray-600 transition-colors"
      >
        <div className="w-4 lg:w-5 h-4 lg:h-5 rounded-full flex items-center justify-center">
          <img
            src="/supported_chains/starknet.png"
            alt="Starknet"
            width={20}
            height={20}
            className="rounded-full"
          />
        </div>
        <span className="text-sm lg:text-base font-medium hidden sm:block">
          {currentNetwork.name}
        </span>
        <ChevronDown className={`w-3 lg:w-4 h-3 lg:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#101D22] border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Select Network
            </div>
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                  currentNetwork.id === network.id
                    ? 'text-[#97FCE4] bg-gray-800'
                    : 'text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src="/supported_chains/starknet.png"
                    alt="Starknet"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{network.name}</span>
                    <span className="text-xs text-gray-400">
                      {network.isTestnet ? 'Testnet' : 'Mainnet'}
                    </span>
                  </div>
                </div>
                {currentNetwork.id === network.id && (
                  <Check className="w-4 h-4 text-[#97FCE4]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkSelector
