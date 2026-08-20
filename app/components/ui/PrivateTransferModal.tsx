import { useState } from 'react'
import { X } from 'lucide-react'
import { STRK20_SHIELD_TOKENS } from '~/lib/services/strk20'
import { parseUnits } from '~/lib/utils/parseUnits'

interface PrivateTransferModalProps {
  isOpen: boolean
  onClose: () => void
  shieldedBalances: Record<string, string>
  onTransfer: (
    tokenAddress: string,
    amount: string,
    decimals: number,
    recipient: string
  ) => Promise<void>
}

function looksLikeStarknetAddress(value: string): boolean {
  const v = value.trim()
  if (!v.startsWith('0x') && !v.startsWith('0X')) return false
  const hex = v.slice(2)
  if (!/^[0-9a-fA-F]+$/.test(hex)) return false
  return hex.length >= 1 && hex.length <= 64
}

export default function PrivateTransferModal({
  isOpen,
  onClose,
  shieldedBalances,
  onTransfer,
}: PrivateTransferModalProps) {
  const [tokenSymbol, setTokenSymbol] = useState<
    (typeof STRK20_SHIELD_TOKENS)[number]['symbol']
  >('USDC')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const token =
    STRK20_SHIELD_TOKENS.find((t) => t.symbol === tokenSymbol) ??
    STRK20_SHIELD_TOKENS[0]
  const maxBalance = shieldedBalances[token.symbol] ?? '0'

  const handleSubmit = async () => {
    if (!looksLikeStarknetAddress(recipient)) {
      setError('Enter a Starknet address (0x…) that is registered in the STRK20 pool')
      return
    }
    let raw: bigint
    try {
      raw = parseUnits(amount.trim(), token.decimals)
    } catch {
      setError('Please enter a valid amount')
      return
    }
    if (raw <= 0n) {
      setError('Please enter a valid amount')
      return
    }
    setIsProcessing(true)
    setError('')
    try {
      await onTransfer(token.address, amount.trim(), token.decimals, recipient.trim())
      setAmount('')
      setRecipient('')
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer failed'
      setError(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1215] rounded-3xl p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">Private send</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Sends a note inside the STRK20 pool. Amount and parties are not shown
          on the public ledger. The recipient must already be registered (Ready
          with STRK20, or strk20.starknet.io/app).
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            {STRK20_SHIELD_TOKENS.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => {
                  setTokenSymbol(t.symbol)
                  setAmount('')
                  setError('')
                }}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium ${
                  tokenSymbol === t.symbol
                    ? 'bg-[#97FCE4] text-black'
                    : 'bg-[#101D22] text-gray-400'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value)
                setError('')
              }}
              placeholder="0x…"
              className="w-full bg-[#101D22] text-white rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#97FCE4]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Amount</label>
              <span className="text-xs text-gray-500">
                Shielded: {maxBalance} {token.symbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                }}
                placeholder="0.00"
                className="w-full bg-[#101D22] text-white rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-[#97FCE4]"
              />
              <button
                type="button"
                onClick={() => setAmount(maxBalance)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#97FCE4] text-sm font-medium hover:underline"
              >
                MAX
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || !amount || !recipient}
            className="flex-1 px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Send privately'}
          </button>
        </div>
      </div>
    </div>
  )
}
