'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ExternalLink, Copy } from 'lucide-react'

export interface AvnuToken {
  address: string
  symbol: string
  decimals: number
  name: string
  logoUri?: string
  logoURI?: string
}

interface TokenSelectModalProps {
  isOpen: boolean
  onClose: () => void
  tokens: AvnuToken[]
  onSelectToken: (token: AvnuToken) => void
  popularSymbols?: string[]
  balances?: Record<string, string>
  isLoading?: boolean
}

const TokenSelectModal = ({
  isOpen,
  onClose,
  tokens,
  onSelectToken,
  popularSymbols = ['WBTC', 'ETH', 'USDC', 'STRK'],
  balances = {},
  isLoading = false,
}: TokenSelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTokens = useMemo(() => {
    if (!Array.isArray(tokens)) return []
    if (!searchQuery.trim()) return tokens
    const query = searchQuery.toLowerCase()
    return tokens.filter(
      (t) =>
        t?.symbol?.toLowerCase().includes(query) ||
        t?.name?.toLowerCase().includes(query) ||
        t?.address?.toLowerCase().includes(query)
    )
  }, [tokens, searchQuery])

  const popularTokens = useMemo(() => {
    if (!Array.isArray(tokens)) return []
    return popularSymbols
      .map((symbol) => tokens.find((t) => t?.symbol === symbol))
      .filter(Boolean) as AvnuToken[]
  }, [tokens, popularSymbols])

  const handleSelectToken = (token: AvnuToken) => {
    onSelectToken(token)
    onClose()
    setSearchQuery('')
  }

  const copyAddress = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(address)
  }

  const openExplorer = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    window.open(`https://voyager.online/contract/${address}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-[#101D22] border border-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Select a token</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#0F1A1F] border border-gray-700 rounded-xl text-white placeholder-gray-500 outline-none focus:border-[#97FCE4] transition-colors"
              />
            </div>
          </div>

          {/* Popular tokens */}
          {popularTokens.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-400 mb-3">Popular tokens</p>
              <div className="flex flex-wrap gap-2">
                {popularTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F1A1F] hover:bg-[#1a2832] border border-gray-700 hover:border-[#97FCE4]/50 rounded-full text-white transition-colors"
                  >
                    {(token.logoUri || token.logoURI) ? (
                      <img
                        src={token.logoUri || token.logoURI}
                        alt={token.symbol}
                        width={24}
                        height={24}
                        className="rounded-full w-6 h-6 object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#97FCE4]/20 flex items-center justify-center">
                        <span className="text-[#97FCE4] text-xs font-bold">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{token.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Token list - scrollable, scrollbar hidden for cleaner look */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#97FCE4] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No tokens found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#0F1A1F] transition-colors text-left group"
                  >
                    {(token.logoUri || token.logoURI) ? (
                      <img
                        src={token.logoUri || token.logoURI}
                        alt={token.symbol}
                        width={40}
                        height={40}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#97FCE4]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#97FCE4] font-bold">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{token.name}</p>
                      <p className="text-sm text-gray-400">{token.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">
                        Balance: {balances[token.address] ?? '0'}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => copyAddress(e, token.address)}
                        className="p-1.5 text-gray-400 hover:text-[#97FCE4] rounded"
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => openExplorer(e, token.address)}
                        className="p-1.5 text-gray-400 hover:text-[#97FCE4] rounded"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TokenSelectModal
