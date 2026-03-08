import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, CheckCircle, QrCode, Download } from 'lucide-react'
import QRCode from 'qrcode'

interface ReceiveModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

const ReceiveModal = ({ isOpen, onClose, walletAddress }: ReceiveModalProps) => {
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(walletAddress, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `wallet-${walletAddress.slice(0, 10)}.png`
      link.click()
    }
  }

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && walletAddress) {
      generateQRCode()
    }
  }, [isOpen, walletAddress])

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
                    <QrCode className="w-5 h-5 text-[#97FCE4]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Receive WBTC</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* QR Code Section */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-6 rounded-2xl mb-4">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="Wallet QR Code" className="w-64 h-64" />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400 text-center mb-4">
                    Scan this QR code to send WBTC to your wallet
                  </p>

                  {qrCodeUrl && (
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Code</span>
                    </button>
                  )}
                </div>

                {/* Wallet Address Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Your Wallet Address
                  </label>
                  <div className="bg-[#0F1A1F] border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-[#97FCE4] font-mono break-all mb-4">
                      {walletAddress}
                    </p>
                    
                    <button
                      onClick={copyToClipboard}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                        copied
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-[#97FCE4] text-black hover:bg-[#85E6D1]'
                      }`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span className="font-medium">Copy Address</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Section */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-blue-300 mb-2">
                    Important Information
                  </h3>
                  <ul className="space-y-2 text-xs text-blue-200">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Only send WBTC (Wrapped Bitcoin) on the Starknet network to this address</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Sending other tokens or using a different network may result in permanent loss</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Always verify the address before sending funds</span>
                    </li>
                  </ul>
                </div>

                {/* Network Badge */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-[#97FCE4] rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Starknet Mainnet</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ReceiveModal
