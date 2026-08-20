import { useState } from 'react'
import { X } from 'lucide-react'
import { STRK20_SHIELD_TOKENS } from '~/lib/services/strk20'
import { parseUnits } from '~/lib/utils/parseUnits'

interface ShieldModalProps {
  isOpen: boolean
  onClose: () => void
  publicBalances: Record<string, string>
  shieldedBalances: Record<string, string>
  onShield: (tokenAddress: string, amount: string, decimals: number) => Promise<void>
  onUnshield: (tokenAddress: string, amount: string, decimals: number) => Promise<void>
}

export default function ShieldModal({
  isOpen,
  onClose,
  publicBalances,
  shieldedBalances,
  onShield,
  onUnshield,
}: ShieldModalProps) {
  const [mode, setMode] = useState<'shield' | 'unshield'>('shield')
  const [tokenSymbol, setTokenSymbol] = useState<(typeof STRK20_SHIELD_TOKENS)[number]['symbol']>('USDC')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const token =
    STRK20_SHIELD_TOKENS.find((t) => t.symbol === tokenSymbol) ??
    STRK20_SHIELD_TOKENS[0]
  const maxBalance =
    mode === 'shield'
      ? publicBalances[token.symbol] ?? '0'
      : shieldedBalances[token.symbol] ?? '0'

  const handleSubmit = async () => {
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
      if (mode === 'shield') {
        await onShield(token.address, amount.trim(), token.decimals)
      } else {
        await onUnshield(token.address, amount.trim(), token.decimals)
      }
      setAmount('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1215] rounded-3xl p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-white">
            {mode === 'shield' ? 'Shield' : 'Unshield'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('shield')
              setAmount('')
              setError('')
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'shield'
                ? 'bg-[#97FCE4] text-black'
                : 'bg-[#101D22] text-gray-400 hover:text-white'
            }`}
          >
            Shield
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('unshield')
              setAmount('')
              setError('')
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'unshield'
                ? 'bg-[#97FCE4] text-black'
                : 'bg-[#101D22] text-gray-400 hover:text-white'
            }`}
          >
            Unshield
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {mode === 'shield'
            ? 'Moves public WBTC or USDC into the STRK20 pool. The deposit size and your address are visible on this step. FPI screens deposits on-chain.'
            : 'Moves shielded notes back to your public Starknet address. Destination and amount are public.'}
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
            <div className="flex justify-between items-center">
              <label className="text-sm text-gray-400">Amount</label>
              <span className="text-xs text-gray-500">
                {mode === 'shield' ? 'Public' : 'Shielded'}: {maxBalance}{' '}
                {token.symbol}
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
            disabled={isProcessing || !amount}
            className="flex-1 px-6 py-3 bg-[#97FCE4] text-black font-medium rounded-full hover:bg-[#85E6D1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? 'Processing...'
              : mode === 'shield'
                ? 'Shield'
                : 'Unshield'}
          </button>
        </div>
      </div>
    </div>
  )
}
