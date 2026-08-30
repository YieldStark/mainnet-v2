/**
 * AVNU swap integration for YieldStark.
 * Uses @avnu/avnu-sdk: getQuotes, executeSwap, fetchTokens.
 */

import {
  getQuotes,
  executeSwap,
  fetchTokens,
  createStrk20WalletProver,
  executePrivateSwap,
  PRIVACY_POOL_ADDRESS,
} from '@avnu/avnu-sdk'
import type { Quote, Token } from '@avnu/avnu-sdk'
import type { AccountInterface } from 'starknet'
import { requireStrk20 } from '~/lib/services/strk20'

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
  provider: AccountInterface
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

export async function runPrivateSwap(params: {
  account: unknown
  quote: Quote
  slippage?: number
}): Promise<{ transactionHash: string }> {
  const walletAccount = requireStrk20(params.account)
  const prover = createStrk20WalletProver(walletAccount)
  return executePrivateSwap({
    quote: params.quote,
    slippage: params.slippage ?? 0.01,
    takerAddress: walletAccount.address,
    poolAddress: PRIVACY_POOL_ADDRESS,
    feeMode: { poolFeeToken: params.quote.sellTokenAddress },
    prover,
  })
}

export { SLIPPAGE, PRIVACY_POOL_ADDRESS }
