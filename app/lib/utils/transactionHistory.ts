/* eslint-disable @typescript-eslint/no-explicit-any */
import { VWBTC_ADDRESS } from '~/lib/utils/Constants'

export interface Transaction {
  hash: string
  timestamp: number
  type: 'deposit' | 'withdraw' | 'transfer'
  amount: string
  from: string
  to: string
  status: string
  blockNumber: number
}

/**
 * Fetch transaction history for a user's address
 */
export async function fetchUserTransactionHistory(
  userAddress: string
): Promise<Transaction[]> {
  try {
    const transactions: Transaction[] = []

    if (VWBTC_ADDRESS) {
      try {
        const response = await fetch(
          `https://api.voyager.online/beta/txns?to=${VWBTC_ADDRESS}&ps=50&p=1`,
          {
            headers: { Accept: 'application/json' },
          }
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
              transactions.push({
                hash: txData.hash || '',
                timestamp: txData.timestamp || Math.floor(Date.now() / 1000),
                type: determineTransactionType(txData, userAddress),
                amount: parseAmount(txData),
                from: txData.from || '',
                to: txData.to || '',
                status: txData.status || 'success',
                blockNumber: txData.blockNumber || 0,
              })
            }
          }
        }
      } catch {
        console.log('Voyager API not available, using fallback method')
      }
    }

    const localTxs = getLocalTransactions(userAddress)
    if (localTxs.length > 0) {
      transactions.push(...localTxs)
    }

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

function parseAmount(tx: { calldata?: unknown[] }): string {
  try {
    if (tx.calldata && Array.isArray(tx.calldata)) {
      return '0'
    }
    return '0'
  } catch {
    return '0'
  }
}

export function saveLocalTransaction(tx: Transaction) {
  try {
    const key = `tx_history_${tx.from.toLowerCase()}`
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
    const key = `tx_history_${userAddress.toLowerCase()}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
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
