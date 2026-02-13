import { RpcProvider } from 'starknet'
import { uint256ToDecimalString } from '~/lib/u256'

function normalizeAddress(accountAddress: string): string {
  const trimmed = (accountAddress || '').trim()
  if (!trimmed) return ''
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
}

/**
 * Fetches ERC20 balance for an address.
 * @returns Balance as human-readable string (e.g. "0.5"), or "0" on error
 */
export async function fetchTokenBalance(
  rpcUrl: string,
  tokenAddress: string,
  accountAddress: string,
  decimals: number
): Promise<string> {
  const address = normalizeAddress(accountAddress)
  if (!address) return '0'

  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl })
    const raw = await provider.callContract({
      contractAddress: tokenAddress,
      entrypoint: 'balance_of',
      calldata: [address],
    })

    const result: string[] = Array.isArray(raw)
      ? raw
      : (raw as { result?: string[] })?.result

    if (!Array.isArray(result) || result.length < 2) {
      return '0'
    }

    const [low, high] = result
    return uint256ToDecimalString(
      { low: low ?? '0', high: high ?? '0' },
      decimals
    )
  } catch {
    return '0'
  }
}
