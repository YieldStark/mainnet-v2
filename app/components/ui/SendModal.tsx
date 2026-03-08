import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, Send, Copy, ExternalLink, Sparkles, AlertCircle } from 'lucide-react'

interface SendModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (recipientAddress: string, amount: string) => Promise<string | void>
  availableBalance: string
}

const SendModal = ({ isOpen, onClose, onSend, availableBalance }: SendModalProps) => {
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [isSending, setIsSending] = useState(false)
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

  const handleSend = async () => {
    if (!amount || !recipientAddress) return
    
    setIsSending(true)
    try {
      const hash = await onSend(recipientAddress, amount)
      if (hash) {
        setTxHash(hash)
        setIsSuccess(true)
        console.log('Send successful! Transaction hash:', hash)
        
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose()
          setAmount('')
          setRecipientAddress('')
          setTxHash(null)
          setIsSuccess(false)
        }, 15000) // 15 seconds
      } else {
        // Close modal immediately if no hash returned
        onClose()
        setAmount('')
        setRecipientAddress('')
      }
    } catch (error) {
      console.error('Send failed:', error)
    } finally {
      setIsSending(false)
    }
  }

  const isValidAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(availableBalance)
  const isValidAddress = recipientAddress && recipientAddress.startsWith('0x') && recipientAddress.length === 66
  const canSend = isValidAmount && isValidAddress && !isSending

  const handleMaxClick = () => {
    setAmount(availableBalance)
  }

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
              className="bg-[#101D22] rounded-2xl p-8 w-full max-w-2xl mx-auto border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#97FCE4]/10 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-[#97FCE4]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Send WBTC</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSuccess && txHash ? (
                /* Success State */
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
                    Transaction Sent! 🎉
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6"
                  >
                    <p className="text-gray-300 mb-2">Successfully sent</p>
                    <p className="text-2xl font-bold text-[#97FCE4]">{amount} WBTC</p>
                    <p className="text-gray-400 text-sm mt-2">Transaction is being processed</p>
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
                </motion.div>
              ) : (
                <>
                  {/* Available Balance */}
                  <div className="mb-6 p-4 bg-[#0F1A1F] rounded-xl border border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Available Balance</span>
                      <span className="text-lg font-medium text-white">{availableBalance} WBTC</span>
                    </div>
                  </div>

                  {/* Recipient Address Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-4 bg-[#0F1A1F] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#97FCE4] focus:outline-none font-mono text-sm"
                    />
                    {recipientAddress && !isValidAddress && (
                      <div className="flex items-center gap-2 mt-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">Invalid Starknet address</p>
                      </div>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Amount to Send
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-[#F7931A] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">₿</span>
                        </div>
                        <span className="text-gray-400 text-sm">WBTC</span>
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.00000001"
                        min="0"
                        max={availableBalance}
                        className="w-full pl-24 pr-20 py-4 bg-[#0F1A1F] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-[#97FCE4] focus:outline-none text-lg font-medium"
                      />
                      <button
                        onClick={handleMaxClick}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-[#97FCE4]/10 text-[#97FCE4] text-xs font-medium rounded-lg hover:bg-[#97FCE4]/20 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    {amount && parseFloat(amount) > parseFloat(availableBalance) && (
                      <div className="flex items-center gap-2 mt-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">Insufficient balance</p>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={`w-full py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      canSend
                        ? 'bg-[#97FCE4] text-black hover:bg-[#85E6D1] shadow-lg shadow-[#97FCE4]/20'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send {amount || '0.00'} WBTC</span>
                      </>
                    )}
                  </button>

                  {/* Warning Notice */}
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-300">
                        Double-check the recipient address. Transactions on Starknet are irreversible.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SendModal
