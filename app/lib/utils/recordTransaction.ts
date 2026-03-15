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
}) {
  try {
    const response = await fetch('/api/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
    });

    if (!response.ok) {
      console.error('Failed to record swap:', await response.text());
    }
  } catch (error) {
    console.error('Error recording swap to database:', error);
  }
}

export async function recordWithdraw(withdrawData: {
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
    const response = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawData)
    });

    if (!response.ok) {
      console.error('Failed to record withdrawal:', await response.text());
    }
  } catch (error) {
    console.error('Error recording withdrawal to database:', error);
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
