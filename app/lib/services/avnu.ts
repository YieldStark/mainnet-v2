/**
 * AVNU API Service
 * Documentation: https://docs.avnu.fi
 */

export interface Token {
  address: string
  symbol: string
  decimals: number
  name: string
}

export interface QuoteRequest {
  sellTokenAddress: string
  buyTokenAddress: string
  sellAmount?: string
  buyAmount?: string
  takerAddress?: string
  slippage?: number
}

export interface QuoteResponse {
  quoteId: string
  sellTokenAddress: string
  buyTokenAddress: string
  sellAmount: string
  buyAmount: string
  buyAmountWithSlippage: string
  sellAmountWithSlippage: string
  routes: Array<{
    percent: number
    swaps: Array<{
      dexId: string
      protocol: string
    }>
  }>
  estimatedGas: string
  expirationTimestamp: number
}

export interface SwapExecution {
  quoteId: string
  takerAddress: string
}

class AvnuService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_AVNU_API_URL || 'https://starknet.api.avnu.fi'
  }

  async getTokens(): Promise<Token[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tokens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching tokens:', error)
      throw error
    }
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    try {
      const params = new URLSearchParams({
        sellTokenAddress: request.sellTokenAddress,
        buyTokenAddress: request.buyTokenAddress,
        ...(request.sellAmount && { sellAmount: request.sellAmount }),
        ...(request.buyAmount && { buyAmount: request.buyAmount }),
        ...(request.takerAddress && { takerAddress: request.takerAddress }),
        ...(request.slippage && { slippage: request.slippage.toString() }),
      })

      const response = await fetch(`${this.baseUrl}/v1/quote?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get quote: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error getting quote:', error)
      throw error
    }
  }

  async executeSwap(execution: SwapExecution): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(execution),
      })

      if (!response.ok) {
        throw new Error(`Failed to execute swap: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error executing swap:', error)
      throw error
    }
  }
}

export const avnuService = new AvnuService()
