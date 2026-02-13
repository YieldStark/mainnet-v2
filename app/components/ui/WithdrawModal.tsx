import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Copy, ExternalLink, Sparkles } from 'lucide-react'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  onWithdraw: (amount: string) => Promise<string>
}

const WithdrawModal = ({ isOpen, onClose, onWithdraw }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const isValidAmount = amount && parseFloat(amount) > 0

  const copyToClipboard = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWithdraw = async () => {
    if (!isValidAmount) return
    setIsWithdrawing(true)
    setError('')
    try {
      const hash = await onWithdraw(amount)
      if (hash) {
        setTxHash(hash)
        setIsSuccess(true)
        setTimeout(() => {
          onClose()
          setAmount('')
          setTxHash(null)
          setIsSuccess(false)
          setError('')
        }, 5000)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal failed. Please try again.'
      setError(errorMessage)
      console.error('Withdrawal error:', err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-[#101D22] rounded-2xl p-8 w-full max-w-2xl mx-auto border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Withdraw from Vault</h2>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSuccess && txHash ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.6, ease: 'backOut' }}
                    className="relative w-24 h-24 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                    <div className="absolute inset-1 bg-[#101D22] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
                    <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-blue-400 animate-bounce delay-100" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold text-white mb-3"
                  >
                    Withdrawal Successful! 🎉
                  </motion.h3>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <p className="text-gray-300 mb-2">Your withdrawal of</p>
                    <p className="text-2xl font-bold text-[#97FCE4]">{amount} WBTC</p>
                    <p className="text-gray-400 text-sm mt-2">has been submitted to the network</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-[#0F1A1F] to-[#1a2832] rounded-xl p-4 border border-gray-700/50"
                  >
                    <p className="text-sm text-gray-400 mb-3">Transaction Hash</p>
                    <div className="bg-[#0b161a] rounded-lg p-3 mb-4">
                      <p className="text-xs text-[#97FCE4] font-mono break-all">{txHash}</p>
                    </div>
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

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xs text-gray-500 mt-6"
                  >
                    Your funds will be available in your wallet shortly
                  </motion.p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Amount (wBTC)</label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      type="number"
                      step="0.00000001"
                      className="w-full bg-[#0b161a] border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#97FCE4]"
                    />
                    {error && (
                      <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleWithdraw}
                    disabled={!isValidAmount || isWithdrawing}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-200 ${
                      isValidAmount && !isWithdrawing
                        ? 'bg-[#97FCE4] text-black hover:bg-[#85E6D1] shadow-lg shadow-[#97FCE4]/20'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isWithdrawing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Withdrawal...</span>
                      </div>
                    ) : (
                      `Withdraw ${amount || '0.00'} wBTC`
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default WithdrawModal
