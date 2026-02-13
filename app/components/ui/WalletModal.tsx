import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Wallet {
  name: string
  icon?: string
  version?: string
  id: string
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  wallets: Wallet[]
  onSelectWallet: (wallet: Wallet) => void
  isConnecting: boolean
}

const WalletModal = ({ isOpen, onClose, wallets, onSelectWallet, isConnecting }: WalletModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#101D22] rounded-2xl p-6 w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Connect Wallet</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Wallet List */}
              <div className="space-y-3">
                {wallets.length > 0 ? (
                  wallets.map((wallet, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => onSelectWallet(wallet)}
                      disabled={isConnecting}
                      className="w-full p-4 bg-[#0F1A1F] rounded-xl border border-gray-700 hover:border-[#97FCE4] transition-all duration-200 flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {wallet.icon ? (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#97FCE4] rounded-lg flex items-center justify-center">
                          <span className="text-black font-bold text-lg">
                            {wallet.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="text-white font-medium">{wallet.name}</div>
                        {wallet.version && (
                          <div className="text-sm text-gray-400">Version {wallet.version}</div>
                        )}
                      </div>
                      {isConnecting && (
                        <div className="w-5 h-5 border-2 border-[#97FCE4] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Wallets Found</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Please install a Starknet wallet to continue
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://www.argent.xyz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-3 bg-[#97FCE4] text-black font-medium rounded-lg hover:bg-[#85E6D1] transition-colors"
                      >
                        Install Argent X
                      </a>
                      <a
                        href="https://braavos.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Install Braavos
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                  By connecting a wallet, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default WalletModal





