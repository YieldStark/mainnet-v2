/**
 * AVNU swap integration for YieldStark.
 * Uses @avnu/avnu-sdk: getQuotes, executeSwap, fetchTokens.
 */

import { getQuotes, executeSwap, fetchTokens } from '@avnu/avnu-sdk'
import type { Quote, Token } from '@avnu/avnu-sdk'

const INTEGRATOR_FEE_BPS = 60n // 0.6%
const INTEGRATOR_FEE_RECIPIENT =
  '0x04b950aB5f6cFa2c7a94fC505C8E68e266a4967056797D4728f7C75F78b8D26C'
const INTEGRATOR_NAME = 'yieldstark'
const SLIPPAGE = 0.005 // 0.5%

export type { Quote, Token }

export async function getVerifiedTokens(): Promise<Token[]> {
  const page = await fetchTokens(
    { tags: ['Verified'], page: 0, size: 100 },
    {}
  )
  return page?.content ?? []
}

export async function getSwapQuotes(params: {
  sellTokenAddress: string
  buyTokenAddress: string
  sellAmount: bigint
  takerAddress: string
}): Promise<Quote[]> {
  return getQuotes(
    {
      sellTokenAddress: params.sellTokenAddress,
      buyTokenAddress: params.buyTokenAddress,
      sellAmount: params.sellAmount,
      takerAddress: params.takerAddress,
      integratorFees: INTEGRATOR_FEE_BPS,
      integratorFeeRecipient: INTEGRATOR_FEE_RECIPIENT,
      integratorName: INTEGRATOR_NAME,
    },
    {}
  )
}

export async function runSwap(params: {
  provider: import('starknet').AccountInterface
  quote: Quote
  slippage?: number
}): Promise<{ transactionHash: string }> {
  return executeSwap(
    {
      provider: params.provider,
      quote: params.quote,
      slippage: params.slippage ?? SLIPPAGE,
      executeApprove: true,
    },
    {}
  )
}

export { SLIPPAGE }
