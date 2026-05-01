/* eslint-disable @typescript-eslint/no-explicit-any */
import { VWBTC_ADDRESS, WBTC_ADDRESS } from '~/lib/utils/Constants'

export interface Transaction {
  hash: string
  timestamp: number
  type: 'deposit' | 'withdraw' | 'transfer'
  amount: string
  from: string
  to: string
  status: string
  blockNumber: number
  /** Human-readable contract/protocol label when known */
  contractLabel?: string
}

/** Known contract addresses (lowercase) -> label for history */
const CONTRACT_LABELS: Record<string, string> = {
  [WBTC_ADDRESS.toLowerCase()]: 'WBTC',
  '0x017891114c00b07317b9102adefbad9fd5de40c5616f094ee09fe2fad67191b1': 'Vesu USDC',
  '0x01a71039b15e5f5413ea450216387877adf962d5908811780c8f3dda5386b166': 'Vesu WBTC Prime',
  '0x00cf3ea1abb06e1f2cba191f10684fc4ce505eba0ed64a847ab6b00ef52e5722': 'Vesu USDC Stable',
  '0x017bd1b103823b17876f4f9ebc3edc61a34445e17f2ca0ca0e94ee9653ccdf0b': 'Vesu WBTC Core',
  '0x076101c3b80af1103c9c6d541ca627f61b5ae7ae79d7fce96ccdf7bdb648450d': 'Troves WBTC/USDC',
  '0x02bcaef2eb7706875a5fdc6853dd961a0590f850bc3a031c59887189b5e84ba1': 'Troves WBTC/USDC.e',
}

const VOYAGER_BASE = 'https://api.voyager.online'

/** Fetch transactions where the wallet is the sender (contract interactions) */
async function fetchVoyagerTxnsBySender(
  userAddress: string
): Promise<Transaction[]> {
  const out: Transaction[] = []
  const addr = userAddress.toLowerCase()
  const urls = [
    `${VOYAGER_BASE}/beta/txns?sender=${encodeURIComponent(userAddress)}&ps=50&p=1`,
    `${VOYAGER_BASE}/beta/txns?from=${encodeURIComponent(userAddress)}&ps=50&p=1`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) continue
      const data = (await res.json()) as { items?: unknown[] }
      const items = data?.items
      if (!Array.isArray(items)) continue
      for (const tx of items) {
        const t = tx as {
          hash?: string
          timestamp?: number
          from?: string
          to?: string
          sender_address?: string
          status?: string
          block_number?: number
          blockNumber?: number
        }
        const from = (t.from ?? t.sender_address ?? '').toString().toLowerCase()
        const to = (t.to ?? '').toString().toLowerCase()
        if (!from || from !== addr) continue
        const hash = t.hash ?? ''
        if (!hash) continue
        const type = determineTransactionType(
          { from: t.from ?? t.sender_address, to: t.to },
          userAddress
        )
        const contractLabel = to ? CONTRACT_LABELS[to] : undefined
        out.push({
          hash,
          timestamp: t.timestamp ?? Math.floor(Date.now() / 1000),
          type,
          amount: parseAmount(t),
          from: t.from ?? t.sender_address ?? '',
          to: t.to ?? '',
          status: (t.status ?? 'success').toString(),
          blockNumber: t.block_number ?? t.blockNumber ?? 0,
          contractLabel,
        })
      }
      if (out.length > 0) return out
    } catch {
      continue
    }
  }
  return out
}

/**
 * Fetch transaction history for a user's address (contract interactions + local).
 */
export async function fetchUserTransactionHistory(
  userAddress: string
): Promise<Transaction[]> {
  try {
    const transactions: Transaction[] = []

    // 1) Voyager: txs by sender (wallet's contract interactions)
    try {
      const bySender = await fetchVoyagerTxnsBySender(userAddress)
      transactions.push(...bySender)
    } catch {
      // ignore
    }

    // 2) Legacy: Voyager txs to a specific contract (e.g. VWBTC) if configured
    if (VWBTC_ADDRESS) {
      try {
        const response = await fetch(
          `${VOYAGER_BASE}/beta/txns?to=${VWBTC_ADDRESS}&ps=50&p=1`,
          { headers: { Accept: 'application/json' } }
        )
        if (response.ok) {
          const data = await response.json()
          if (data.items && Array.isArray(data.items)) {
            const userTxs = data.items.filter(
              (tx: { from?: string; to?: string }) =>
                tx.from?.toLowerCase() === userAddress.toLowerCase() ||
                tx.to?.toLowerCase() === userAddress.toLowerCase()
            )
            for (const tx of userTxs) {
              const txData = tx as {
                hash?: string
                timestamp?: number
                from?: string
                to?: string
                status?: string
                blockNumber?: number
                calldata?: unknown[]
              }
              const to = (txData.to ?? '').toString().toLowerCase()
              transactions.push({
                hash: txData.hash || '',
                timestamp: txData.timestamp || Math.floor(Date.now() / 1000),
                type: determineTransactionType(txData, userAddress),
                amount: parseAmount(txData),
                from: txData.from || '',
                to: txData.to || '',
                status: txData.status || 'success',
                blockNumber: txData.blockNumber || 0,
                contractLabel: to ? CONTRACT_LABELS[to] : undefined,
              })
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3) Local (in-app) transactions
    const localTxs = getLocalTransactions(userAddress)
    transactions.push(...localTxs)

    transactions.sort((a, b) => b.timestamp - a.timestamp)

    const uniqueTxs = Array.from(
      new Map(transactions.map((tx) => [tx.hash, tx])).values()
    )

    return uniqueTxs
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

function determineTransactionType(
  tx: { from?: string; to?: string },
  userAddress: string
): 'deposit' | 'withdraw' | 'transfer' {
  const isFromUser = tx.from?.toLowerCase() === userAddress.toLowerCase()
  if (isFromUser) {
    return 'deposit'
  }
  return 'transfer'
}

function parseAmount(_tx: unknown): string {
  try {
    return '0'
  } catch {
    return '0'
  }
}

/** User address for history: withdraw => receiver (tx.to), else => sender (tx.from). */
function getUserKeyForTx(tx: Transaction): string {
  return (tx.type === 'withdraw' ? tx.to : tx.from).toLowerCase()
}

export function saveLocalTransaction(tx: Transaction) {
  try {
    const key = `tx_history_${getUserKeyForTx(tx)}`
    const existing = localStorage.getItem(key)
    const txs: Transaction[] = existing ? JSON.parse(existing) : []

    if (!txs.find((t) => t.hash === tx.hash)) {
      txs.push(tx)
      localStorage.setItem(key, JSON.stringify(txs))
    }
  } catch (error) {
    console.error('Error saving transaction locally:', error)
  }
}

export function getLocalTransactions(userAddress: string): Transaction[] {
  try {
    const addr = userAddress.toLowerCase()
    const seen = new Set<string>()
    const txs: Transaction[] = []
    // Scan all tx_history_* keys so we find the user's txs no matter which key they were saved under
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('tx_history_')) continue
      const data = localStorage.getItem(key)
      if (!data) continue
      try {
        const arr: Transaction[] = JSON.parse(data)
        for (const tx of arr) {
          const from = (tx.from || '').toLowerCase()
          const to = (tx.to || '').toLowerCase()
          if ((from === addr || to === addr) && !seen.has(tx.hash)) {
            seen.add(tx.hash)
            txs.push(tx)
          }
        }
      } catch {
        continue
      }
    }
    return txs.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error reading local transactions:', error)
    return []
  }
}

export function clearLocalTransactions(userAddress: string) {
  try {
    const key = `tx_history_${userAddress.toLowerCase()}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing local transactions:', error)
  }
}
