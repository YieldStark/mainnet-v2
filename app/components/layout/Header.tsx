import { Link, useLocation } from 'react-router'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { connect, disconnect } from '@starknet-io/get-starknet'
import { WalletAccount } from 'starknet'
import { useWalletStore } from '~/providers/wallet-store-provider'
import { useNetworkStore } from '~/stores/network-store'

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation()
  const pathname = location.pathname
  const [isConnecting, setIsConnecting] = useState(false)
  const currentNetwork = useNetworkStore((state) => state.currentNetwork)

  const { isConnected, connectWallet, disconnectWallet, updateBalances } = useWalletStore(
    (state) => state
  )

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Docs', href: '/docs' },
    { name: 'Support', href: '/support' },
  ]

  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const lastWallet = await connect({ modalMode: 'neverAsk' })
        if (lastWallet) {
          const myWalletAccount = await WalletAccount.connect(
            { nodeUrl: currentNetwork.rpcUrl },
            lastWallet
          )
          connectWallet(myWalletAccount)
          updateBalances(currentNetwork.rpcUrl)
        }
      } catch {
        // No existing wallet connection found
      }
    }

    checkExistingConnection()
  }, [currentNetwork.rpcUrl])

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)

      const selectedWallet = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
      })

      if (selectedWallet) {
        const myWalletAccount = await WalletAccount.connect(
          { nodeUrl: currentNetwork.rpcUrl },
          selectedWallet
        )

        connectWallet(myWalletAccount)
        updateBalances(currentNetwork.rpcUrl)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      await disconnect()
      disconnectWallet()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const vaultAddress = useWalletStore((state) => state.vaultAddress)

  return (
    <header className="w-full bg-[#0F1A1F] border-b border-gray-800 mb-10">
      <div className="max-w-10xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center space-x-4">
              <img
                src="/brand/yieldstark.jpg"
                alt="YieldStark"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span
                className="text-2xl font-medium"
                style={{ fontFamily: 'var(--font-median)' }}
              >
                YieldStark
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex space-x-12">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-base font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-[#97FCE4] border-b-2 border-[#97FCE4] pb-1'
                    : 'text-white hover:text-[#97FCE4]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3 lg:space-x-6">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                {vaultAddress && (
                  <div className="hidden sm:block text-xs text-gray-400 font-mono">
                    {formatAddress(vaultAddress)}
                  </div>
                )}
                <button
                  onClick={handleDisconnectWallet}
                  className="px-4 lg:px-8 py-2 lg:py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors text-sm lg:text-base"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="px-4 lg:px-8 py-2 lg:py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
