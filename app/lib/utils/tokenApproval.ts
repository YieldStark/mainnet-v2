// Token approval utilities for DeFi interactions
import { Contract, Account, uint256 } from "starknet";
import { universalErc20Abi } from "../abi/erc20";

/**
 * Approve a spender to use tokens on behalf of the user
 * @param account - User's Starknet account
 * @param tokenAddress - Address of the token contract
 * @param spenderAddress - Address of the spender (e.g., vToken contract)
 * @param amount - Amount to approve (use max uint256 for unlimited approval)
 * @returns Transaction hash
 */
export async function approveToken(
  account: Account,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<string> {
  const tokenContract = new Contract(universalErc20Abi, tokenAddress, account);

  const approveCall = tokenContract.populate("approve", [
    spenderAddress,
    uint256.bnToUint256(amount),
  ]);

  const { transaction_hash } = await account.execute(approveCall);
  return transaction_hash;
}

/**
 * Check the current allowance for a spender
 * @param account - User's Starknet account
 * @param tokenAddress - Address of the token contract
 * @param ownerAddress - Address of the token owner
 * @param spenderAddress - Address of the spender
 * @returns Current allowance amount
 */
export async function checkAllowance(
  account: Account,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  const tokenContract = new Contract(universalErc20Abi, tokenAddress, account);

  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  return uint256.uint256ToBN(allowance);
}

/**
 * Get maximum uint256 value for unlimited approvals
 */
export const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);
