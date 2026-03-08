import { data } from "react-router";
import type { Route } from "./+types/api.swap";
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
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      decimalsIn,
      volumeWbtc,
      volumeUsd,
      volumeStrk,
      poolAddress,
      protocol
    } = body;
    
    let finalVolumeUsd = volumeUsd;
    let finalVolumeWbtc = volumeWbtc;
    let finalVolumeStrk = volumeStrk;
    
    if (!finalVolumeUsd && decimalsIn) {
      finalVolumeUsd = await convertToUsd(tokenIn, amountIn, decimalsIn);
    }
    if (!finalVolumeWbtc && decimalsIn) {
      finalVolumeWbtc = await convertToWbtc(tokenIn, amountIn, decimalsIn);
    }
    if (!finalVolumeStrk && decimalsIn) {
      finalVolumeStrk = await convertToStrk(tokenIn, amountIn, decimalsIn);
    }

    if (!transactionHash || !userAddress) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO app_db.swaps (
        transaction_hash, block_number, timestamp, user_address,
        token_in, token_out, amount_in, amount_out,
        volume_wbtc, volume_usd, volume_strk,
        pool_address, protocol
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (transaction_hash) DO NOTHING
      RETURNING id`,
      [
        transactionHash,
        blockNumber || 0,
        timestamp ? new Date(timestamp * 1000) : new Date(),
        userAddress,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        finalVolumeWbtc,
        finalVolumeUsd,
        finalVolumeStrk,
        poolAddress,
        protocol
      ]
    );

    return data({ success: true, id: result.rows[0]?.id });
  } catch (error) {
    console.error("Error recording swap:", error);
    return data(
      { error: "Failed to record swap" },
      { status: 500 }
    );
  }
}
