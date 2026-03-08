import { data } from "react-router";
import type { Route } from "./+types/api.deposit";
import { query } from "~/lib/db";
import { convertToUsd, convertToWbtc, convertToStrk } from "~/lib/utils/priceConversion";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      transactionHash,
      blockNumber,
      timestamp,
      userAddress,
      tokenAddress,
      tokenSymbol,
      amountRaw,
      decimals,
      amountWbtc,
      amountUsd,
      amountStrk,
      status,
      poolAddress
    } = body;
    
    let finalAmountUsd = amountUsd;
    let finalAmountWbtc = amountWbtc;
    let finalAmountStrk = amountStrk;
    
    if (!finalAmountUsd && decimals) {
      finalAmountUsd = await convertToUsd(tokenAddress, amountRaw, decimals);
    }
    if (!finalAmountWbtc && decimals) {
      finalAmountWbtc = await convertToWbtc(tokenAddress, amountRaw, decimals);
    }
    if (!finalAmountStrk && decimals) {
      finalAmountStrk = await convertToStrk(tokenAddress, amountRaw, decimals);
    }

    if (!transactionHash || !userAddress || !tokenAddress) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO app_db.deposits (
        transaction_hash, block_number, timestamp, user_address,
        token_address, token_symbol, amount_raw,
        amount_wbtc, amount_usd, amount_strk,
        status, pool_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (transaction_hash) DO NOTHING
      RETURNING id`,
      [
        transactionHash,
        blockNumber || 0,
        timestamp ? new Date(timestamp * 1000) : new Date(),
        userAddress,
        tokenAddress,
        tokenSymbol,
        amountRaw,
        finalAmountWbtc,
        finalAmountUsd,
        finalAmountStrk,
        status || 'completed',
        poolAddress
      ]
    );

    return data({ success: true, id: result.rows[0]?.id });
  } catch (error) {
    console.error("Error recording deposit:", error);
    return data(
      { error: "Failed to record deposit" },
      { status: 500 }
    );
  }
}
