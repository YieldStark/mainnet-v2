import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Shield, Zap, TrendingUp, Copy, ExternalLink, Sparkles } from 'lucide-react'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onDeposit: (amount: string) => Promise<string | void>
}

const DepositModal = ({ isOpen, onClose, onDeposit }: DepositModalProps) => {
  const [amount, setAmount] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeposit = async () => {
    if (!amount || !agreedToTerms) return
    
    setIsDepositing(true)
    try {
      const hash = await onDeposit(amount)
      if (hash) {
        setTxHash(hash)
        setIsSuccess(true)
        console.log('Deposit successful! Transaction hash:', hash)
        
        // Transaction is saved in the parent component (dashboard page)
        // where we have access to the wallet address
        
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose()
          setAmount('')
          setAgreedToTerms(false)
          setTxHash(null)
          setIsSuccess(false)
        }, 15000) // 15 seconds
      } else {
        // Close modal immediately if no hash returned
        onClose()
        setAmount('')
        setAgreedToTerms(false)
      }
    } catch (error) {
      console.error('Deposit failed:', error)
    } finally {
      setIsDepositing(false)
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0
  const canDeposit = isValidAmount && agreedToTerms && !isDepositing

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#101D22] rounded-2xl p-8 w-full max-w-4xl mx-auto border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Deposit to Vault</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Amount to Deposit
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#F7931A] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₿</span>
                    </div>
                    <span className="text-gray-400 text-sm">$wBTC</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.00000001"
                    min="0"
                    className="w-full pl-24 pr-4 py-4 bg-[#0F1A1F] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#97FCE4] focus:outline-none text-lg font-medium"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Minimum deposit: 0.001 $wBTC
                </p>
              </div>

              {/* How YieldStark Works */}
              <div className="mb-6 p-4 bg-[#0F1A1F] rounded-xl border border-gray-800">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Zap className="w-4 h-4 text-[#97FCE4] mr-2" />
                  How YieldStark Works
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  YieldStark automatically spreads your $wBTC across the most profitable yield protocols on Starknet. 
                  Our AI agent continuously monitors and rebalances your funds to maximize returns while managing risk.
                </p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3 text-[#97FCE4]" />
                    <span className="text-xs text-gray-300">Multi-protocol diversification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-[#97FCE4]" />
                    <span className="text-xs text-gray-300">Automated yield optimization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-[#97FCE4]" />
                    <span className="text-xs text-gray-300">Audited smart contracts</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#97FCE4] bg-[#0F1A1F] border-gray-700 rounded focus:ring-[#97FCE4] focus:ring-2"
                  />
                  <span className="text-sm text-gray-300 leading-relaxed">
                    I agree to the{' '}
                    <span className="text-[#97FCE4] hover:underline cursor-pointer">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="text-[#97FCE4] hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                    . I understand that my funds will be automatically deployed across yield protocols and that there are inherent risks involved.
                  </span>
                </label>
              </div>

              {/* Success State */}
              {isSuccess && txHash ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center py-8"
                >
                  {/* Success Icon with Animation */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.6, ease: "backOut" }}
                    className="relative w-24 h-24 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                    <div className="absolute inset-1 bg-[#101D22] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    {/* Sparkles */}
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
                    <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-blue-400 animate-bounce delay-100" />
                  </motion.div>

                  {/* Success Message */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-white mb-3"
                  >
                    Deposit Successful! 🚀
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <p className="text-gray-300 mb-2">Your deposit of</p>
                    <p className="text-2xl font-bold text-[#97FCE4]">{amount} WBTC</p>
                    <p className="text-gray-400 text-sm mt-2">has been submitted to the network</p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Now earning yield automatically</span>
                    </div>
                  </motion.div>

                  {/* Transaction Hash */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-[#0F1A1F] to-[#1a2832] rounded-xl p-4 border border-gray-700/50"
                  >
                    <p className="text-sm text-gray-400 mb-3">Transaction Hash</p>
                    <div className="bg-[#0b161a] rounded-lg p-3 mb-4">
                      <p className="text-xs text-[#97FCE4] font-mono break-all">
                        {txHash}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy Hash</span>
                          </>
                        )}
                      </button>
                      
                      <a
                        href={`https://voyager.online/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#97FCE4] hover:bg-[#85E6D1] text-black rounded-lg transition-all duration-200 font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">View on Explorer</span>
                      </a>
                    </div>
                  </motion.div>

                  {/* Info Message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-gray-500 mt-6"
                  >
                    Your funds are now working for you across the best yield opportunities
                  </motion.p>
                </motion.div>
              ) : (
                /* Deposit Button */
                <button
                  onClick={handleDeposit}
                  disabled={!canDeposit}
                  className={`w-full py-4 rounded-xl font-medium transition-all duration-200 ${
                    canDeposit
                      ? 'bg-[#97FCE4] text-black hover:bg-[#85E6D1] shadow-lg shadow-[#97FCE4]/20'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isDepositing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Deposit...</span>
                    </div>
                  ) : (
                    `Deposit ${amount || '0.00'} $wBTC`
                  )}
                </button>
              )}

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-300">
                    Your funds are secured by multi-signature wallets and audited smart contracts. 
                    You maintain full control of your assets at all times.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DepositModal
