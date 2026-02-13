import { RpcProvider } from 'starknet'
import { uint256ToDecimalString } from '~/lib/u256'
import { WBTC_ADDRESS } from '~/lib/utils/Constants'

const WBTC_DECIMALS = 8

function normalizeAddress(accountAddress: string): string {
  const trimmed = (accountAddress || '').trim()
  if (!trimmed) return ''
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
}

/**
 * Fetches WBTC balance for an address on mainnet.
 * @param rpcUrl - Starknet RPC URL (mainnet)
 * @param accountAddress - Wallet/account address (felt hex)
 * @returns Balance as a number (human-readable, e.g. 0.5 for 0.5 WBTC), or 0 on error
 */
export async function fetchWbtcBalance(
  rpcUrl: string,
  accountAddress: string
): Promise<number> {
  const address = normalizeAddress(accountAddress)
  if (!address) return 0

  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl })
    const raw = await provider.callContract({
      contractAddress: WBTC_ADDRESS,
      entrypoint: 'balance_of',
      calldata: [address],
    })

    // Starknet.js may return string[] or (for some RPC wrappers) { result: string[] }
    const result: string[] = Array.isArray(raw)
      ? raw
      : (raw as { result?: string[] })?.result

    if (!Array.isArray(result) || result.length < 2) {
      return 0
    }

    const [low, high] = result
    const balanceStr = uint256ToDecimalString(
      { low: low ?? '0', high: high ?? '0' },
      WBTC_DECIMALS
    )
    return parseFloat(balanceStr) || 0
  } catch (error) {
    console.error('Failed to fetch WBTC balance:', error)
    return 0
  }
}
