// Minimal ERC20 ABI for balance reads (mainnet) - same pattern as testnet
// Supports both balance_of (Cairo/OZ) and balanceOf (camelCase) for compatibility
export const erc20BalanceAbi = [
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view',
  },
] as const
