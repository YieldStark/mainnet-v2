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

export async function recordWithdrawal(withdrawalData: {
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
      body: JSON.stringify(withdrawalData)
    });

    if (!response.ok) {
      console.error('Failed to record withdrawal:', await response.text());
    }
  } catch (error) {
    console.error('Error recording withdrawal to database:', error);
  }
}

export async function recordLoan(loanData: {
  transactionHash: string;
  blockNumber?: number;
  timestamp?: number;
  userAddress: string;
  action: 'borrow' | 'repay' | 'withdraw_collateral';
  poolAddress?: string;
  poolLabel?: string;
  collateralSymbol?: string;
  debtSymbol?: string;
  collateralAmountRaw?: string;
  debtAmountRaw?: string;
  amount?: string;
  amountUsd?: number;
  status?: string;
}) {
  try {
    const response = await fetch('/api/loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loanData)
    });

    if (!response.ok) {
      console.error('Failed to record loan:', await response.text());
    }
  } catch (error) {
    console.error('Error recording loan to database:', error);
  }
}
