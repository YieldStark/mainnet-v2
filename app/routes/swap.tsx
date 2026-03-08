import { useEffect, useState, useCallback, useRef } from 'react'
import Layout from '~/components/layout/Layout'
import TokenSelectModal from '~/components/ui/TokenSelectModal'
import type { AvnuToken } from '~/components/ui/TokenSelectModal'
import { useWalletStore } from '~/providers/wallet-store-provider'
import { useNetworkStore } from '~/stores/network-store'
import { WBTC_ADDRESS, USDC_ADDRESS } from '~/lib/utils/Constants'
import {
  getVerifiedTokens,
  getSwapQuotes,
  runSwap,
  type Token,
  type Quote,
} from '~/lib/avnu-swap'
import { parseUnits, formatUnits } from '~/lib/utils/parseUnits'
import { fetchTokenBalance } from '~/lib/utils/fetchTokenBalance'
import toast from 'react-hot-toast'
import { recordSwap } from '~/lib/utils/recordTransaction'

const BATCH_SIZE = 10
const QUOTE_DEBOUNCE_MS = 400

function tokenToAvnu(t: Token): AvnuToken {
  return {
    address: t.address,
    symbol: t.symbol,
    decimals: t.decimals,
    name: t.name,
    logoUri: t.logoUri ?? undefined,
  }
}

export default function SwapPage() {
  const currentNetwork = useNetworkStore((s) => s.currentNetwork)
  const vaultAddress = useWalletStore((s) => s.vaultAddress)
  const isConnected = useWalletStore((s) => s.isConnected)
  const wallet = useWalletStore((s) => s.wallet)
  const updateBalances = useWalletStore((s) => s.updateBalances)

  const [tokens, setTokens] = useState<Token[]>([])
  const [tokensLoading, setTokensLoading] = useState(true)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [sellToken, setSellToken] = useState<Token | null>(null)
  const [buyToken, setBuyToken] = useState<Token | null>(null)
  const [sellAmount, setSellAmount] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [tokenModalFor, setTokenModalFor] = useState<'sell' | 'buy' | null>(null)
  const [lastSwapTxHash, setLastSwapTxHash] = useState<string | null>(null)
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0)
  const quoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch verified tokens
  useEffect(() => {
    let cancelled = false
    setTokensLoading(true)
    getVerifiedTokens()
      .then((list) => {
        if (!cancelled) setTokens(list)
      })
      .catch(() => {
        if (!cancelled) setTokens([])
      })
      .finally(() => {
        if (!cancelled) setTokensLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Normalize address for comparison (AVNU may use different casing/padding)
  const normalizeAddr = (a: string) =>
    a.replace(/^0x/, '').toLowerCase().padStart(64, '0')

  // Default sell token to USDC, buy token to WBTC when tokens load
  useEffect(() => {
    if (tokens.length === 0) return
    if (!sellToken) {
      const usdc =
        tokens.find(
          (t) => normalizeAddr(t.address) === normalizeAddr(USDC_ADDRESS)
        ) ?? tokens.find((t) => t.symbol === 'USDC')
      if (usdc) setSellToken(usdc)
    }
    if (!buyToken) {
      const wbtc =
        tokens.find(
          (t) => normalizeAddr(t.address) === normalizeAddr(WBTC_ADDRESS)
        ) ?? tokens.find((t) => t.symbol === 'WBTC')
      if (wbtc) setBuyToken(wbtc)
    }
  }, [tokens, sellToken, buyToken])

  // Fetch balances when we have tokens and user address (batched)
  useEffect(() => {
    if (!tokens.length || !vaultAddress || !currentNetwork.rpcUrl) return
    let cancelled = false
    const run = async () => {
      const next: Record<string, string> = {}
      for (let i = 0; i < tokens.length && !cancelled; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (t) => {
            const bal = await fetchTokenBalance(
              currentNetwork.rpcUrl,
              t.address,
              vaultAddress,
              t.decimals
            )
            if (!cancelled) next[t.address] = bal
          })
        )
      }
      if (!cancelled) setBalances((prev) => ({ ...prev, ...next }))
    }
    run()
    return () => {
      cancelled = true
    }
  }, [tokens, vaultAddress, currentNetwork.rpcUrl, balanceRefreshKey])

  // Fetch quote when sell token, buy token, amount and taker are set (debounced)
  useEffect(() => {
    if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current)
    const sameToken =
      sellToken &&
      buyToken &&
      sellToken.address.toLowerCase() === buyToken.address.toLowerCase()
    if (
      !sellToken ||
      !buyToken ||
      !sellAmount.trim() ||
      !vaultAddress ||
      sameToken
    ) {
      setQuote(null)
      return
    }
    const raw = parseUnits(sellAmount.trim(), sellToken.decimals)
    if (raw === 0n) {
      setQuote(null)
      return
    }
    quoteTimeoutRef.current = setTimeout(() => {
      setQuoteLoading(true)
      setQuote(null)
      getSwapQuotes({
        sellTokenAddress: sellToken.address,
        buyTokenAddress: buyToken.address,
        sellAmount: raw,
        takerAddress: vaultAddress,
      })
        .then((quotes) => {
          if (quotes.length > 0) setQuote(quotes[0])
          else setQuote(null)
        })
        .catch(() => setQuote(null))
        .finally(() => setQuoteLoading(false))
    }, QUOTE_DEBOUNCE_MS)
    return () => {
      if (quoteTimeoutRef.current) clearTimeout(quoteTimeoutRef.current)
    }
  }, [sellToken, buyToken, sellAmount, vaultAddress])

  const avnuTokens = tokens.map(tokenToAvnu)
  const buyDecimals = buyToken?.decimals ?? 8
  const buyAmountFormatted = quote
    ? formatUnits(quote.buyAmount, buyDecimals)
    : '0'
  const priceImpactPct = quote
    ? (Number(quote.priceImpact) / 100).toFixed(2)
    : '0'

  const handleSelectToken = useCallback(
    (t: AvnuToken, forSide: 'sell' | 'buy') => {
      const token =
        tokens.find((x) => x.address.toLowerCase() === t.address.toLowerCase()) ??
        null
      if (forSide === 'sell') setSellToken(token)
      else setBuyToken(token)
      setTokenModalFor(null)
    },
    [tokens]
  )

  const handleSwap = useCallback(async () => {
    if (!quote || !wallet || !vaultAddress || !sellToken || !buyToken) return
    const account = wallet as unknown as import('starknet').AccountInterface
    setSwapping(true)
    setLastSwapTxHash(null)
    try {
      const { transactionHash } = await runSwap({ provider: account, quote })
      toast.success('Swap complete')
      
      recordSwap({
        transactionHash,
        timestamp: Math.floor(Date.now() / 1000),
        userAddress: vaultAddress,
        tokenIn: sellToken.address,
        tokenOut: buyToken.address,
        amountIn: quote.sellAmount.toString(),
        amountOut: quote.buyAmount.toString(),
        decimalsIn: sellToken.decimals,
        poolAddress: quote.routes?.[0]?.name,
        protocol: 'avnu'
      }).catch(err => console.error('Failed to record swap:', err))
      
      setSellAmount('')
      setQuote(null)
      setLastSwapTxHash(transactionHash)
      updateBalances(currentNetwork.rpcUrl)
      setBalanceRefreshKey((k) => k + 1)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }, [quote, wallet, vaultAddress, sellToken, buyToken, currentNetwork.rpcUrl, updateBalances])

  const canSwap =
    isConnected &&
    quote &&
    sellToken &&
    buyToken &&
    sellAmount.trim() &&
    parseUnits(sellAmount.trim(), sellToken.decimals) > 0n &&
    !swapping

  return (
    <Layout showSidebar={true}>
      <div className="w-full min-h-[calc(100vh-180px)] flex items-center justify-center py-8">
        <div className="bg-[#101D22] rounded-4xl p-6 max-w-lg w-full">
          <h1 className="text-2xl font-medium text-white mb-6">Swap</h1>

          {/* Sell */}
          <div className="rounded-2xl bg-[#0F1A1F] border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Sell</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => {
                  setSellAmount(e.target.value)
                  if (lastSwapTxHash) setLastSwapTxHash(null)
                }}
                className="flex-1 bg-transparent text-white text-xl outline-none placeholder-gray-500 min-w-0"
              />
              <button
                type="button"
                onClick={() => setTokenModalFor('sell')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a2832] border border-gray-700 hover:border-[#97FCE4]/50 text-white transition-colors"
              >
                {sellToken ? (
                  <>
                    {sellToken.logoUri ? (
                      <img
                        src={sellToken.logoUri}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#97FCE4]/20 flex items-center justify-center text-[#97FCE4] text-xs font-bold">
                        {sellToken.symbol.charAt(0)}
                      </span>
                    )}
                    <span>{sellToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Select</span>
                )}
              </button>
            </div>
            {sellToken && vaultAddress && (
              <p className="text-sm text-gray-500 mt-1">
                Balance: {balances[sellToken.address] ?? '0'}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#101D22] border border-gray-800 flex items-center justify-center text-gray-400">
              ↓
            </div>
          </div>

          {/* Buy */}
          <div className="rounded-2xl bg-[#0F1A1F] border border-gray-800 p-4 mb-4">
            <p className="text-xs text-gray-400 mb-2">Buy</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-xl text-white">
                {quoteLoading ? '…' : buyAmountFormatted}
              </div>
              <button
                type="button"
                onClick={() => setTokenModalFor('buy')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a2832] border border-gray-700 hover:border-[#97FCE4]/50 text-white transition-colors"
              >
                {buyToken ? (
                  <>
                    {buyToken.logoUri ? (
                      <img
                        src={buyToken.logoUri}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-[#97FCE4]/20 flex items-center justify-center text-[#97FCE4] text-xs font-bold">
                        {buyToken.symbol.charAt(0)}
                      </span>
                    )}
                    <span>{buyToken.symbol}</span>
                  </>
                ) : (
                  <span className="text-gray-400">Select</span>
                )}
              </button>
            </div>
            {quote && (
              <p className="text-sm text-gray-500 mt-1">
                Price impact: {priceImpactPct}%
              </p>
            )}
            {buyToken && vaultAddress && (
              <p className="text-sm text-gray-500 mt-1">
                Balance: {balances[buyToken.address] ?? '0'}
              </p>
            )}
          </div>

          {/* Action */}
          {!isConnected ? (
            <p className="text-center text-gray-400 text-sm py-2">
              Connect wallet to swap
            </p>
          ) : (
            <button
              type="button"
              disabled={!canSwap}
              onClick={handleSwap}
              className="w-full py-4 rounded-xl font-medium text-black bg-[#97FCE4] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {swapping ? 'Swapping…' : 'Swap'}
            </button>
          )}

          {/* Swap complete */}
          {lastSwapTxHash && (
            <div className="mt-4 p-4 rounded-xl bg-[#0F1A1F] border border-[#97FCE4]/30">
              <p className="text-[#97FCE4] font-medium mb-2">Swap complete</p>
              <a
                href={`https://voyager.online/tx/${lastSwapTxHash}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-gray-400 hover:text-[#97FCE4] transition-colors"
              >
                View on Voyager →
              </a>
            </div>
          )}
        </div>
      </div>

      <TokenSelectModal
        isOpen={tokenModalFor !== null}
        onClose={() => setTokenModalFor(null)}
        tokens={avnuTokens}
        onSelectToken={(t) =>
          tokenModalFor && handleSelectToken(t, tokenModalFor)
        }
        popularSymbols={['ETH', 'USDC', 'STRK', 'WBTC']}
        balances={balances}
        isLoading={tokensLoading}
      />
    </Layout>
  )
}
