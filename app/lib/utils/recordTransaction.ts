export async function recordSwap(swapData: {
  transactionHash: string;
  blockNumber?: number;
  timestamp?: number;
  userAddress: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  decimalsIn?: number;
  volumeWbtc?: number;
  volumeUsd?: number;
  volumeStrk?: number;
  poolAddress?: string;
  protocol?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to record swap:', text);
      return { success: false, error: text };
    }

    const result = await response.json();
    return { success: true };
  } catch (error) {
    console.error('Error recording swap to database:', error);
    return { success: false, error: String(error) };
  }
}

export async function recordDeposit(depositData: {
  transactionHash: string;
  blockNumber?: number;
  timestamp?: number;
  userAddress: string;
  tokenAddress: string;
  tokenSymbol?: string;
  amountRaw: string;
  decimals: number;
  amountWbtc?: number;
  amountUsd?: number;
  amountStrk?: number;
  status?: string;
  poolAddress?: string;
}) {
  try {
    const response = await fetch('/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(depositData)
    });

    if (!response.ok) {
      console.error('Failed to record deposit:', await response.text());
    }
  } catch (error) {
    console.error('Error recording deposit to database:', error);
  }
}
