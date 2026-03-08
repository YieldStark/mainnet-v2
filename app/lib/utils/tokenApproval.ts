// Token approval utilities for DeFi interactions
import { uint256, RpcProvider, CallData } from "starknet";

/**
 * Approve a spender to use tokens on behalf of the user
 * @param account - User's Starknet account
 * @param tokenAddress - Address of the token contract
 * @param spenderAddress - Address of the spender (e.g., vToken contract)
 * @param amount - Amount to approve (use max uint256 for unlimited approval)
 * @returns Transaction hash
 */
export async function approveToken(
  account: any,
  tokenAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<string> {
  try {
    // Convert amount to uint256 format
    const amountUint256 = uint256.bnToUint256(amount);
    
    console.log("=== APPROVE TOKEN DEBUG ===");
    console.log("Account address:", account.address);
    console.log("Token address:", tokenAddress);
    console.log("Spender address:", spenderAddress);
    console.log("Amount (bigint):", amount.toString());
    console.log("Amount uint256 low:", amountUint256.low);
    console.log("Amount uint256 high:", amountUint256.high);
    console.log("===========================");
    
    // Prepare the approve call data with proper uint256 format
    const { transaction_hash } = await account.execute({
      contractAddress: tokenAddress,
      entrypoint: "approve",
      calldata: [
        spenderAddress,
        amountUint256.low,
        amountUint256.high,
      ],
    });

    console.log("Approval transaction hash:", transaction_hash);
    return transaction_hash;
  } catch (error) {
    console.error("approveToken error:", error);
    throw error;
  }
}

/**
 * Check the current allowance for a spender
 * @param rpcUrl - RPC provider URL
 * @param tokenAddress - Address of the token contract
 * @param ownerAddress - Address of the token owner
 * @param spenderAddress - Address of the spender
 * @returns Current allowance amount
 */
export async function checkAllowance(
  rpcUrl: string,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  try {
    const provider = new RpcProvider({ nodeUrl: rpcUrl });
    
    const result = await provider.callContract({
      contractAddress: tokenAddress,
      entrypoint: "allowance",
      calldata: [ownerAddress, spenderAddress],
    });

    const resultArray: string[] = Array.isArray(result)
      ? result
      : (result as { result?: string[] })?.result || [];

    if (resultArray.length < 2) {
      return 0n;
    }

    return uint256.uint256ToBN({ low: resultArray[0], high: resultArray[1] });
  } catch (error) {
    console.error("checkAllowance error:", error);
    return 0n;
  }
}

/**
 * Get maximum uint256 value for unlimited approvals
 */
export const MAX_UINT256 = BigInt(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);
