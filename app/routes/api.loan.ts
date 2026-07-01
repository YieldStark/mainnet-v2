import { data } from "react-router";
import type { Route } from "./+types/api.loan";
import { query } from "~/lib/db";

const VALID_ACTIONS = new Set(["borrow", "repay", "withdraw_collateral"]);

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
      action: loanAction,
      poolAddress,
      poolLabel,
      collateralSymbol,
      debtSymbol,
      collateralAmountRaw,
      debtAmountRaw,
      amount,
      amountUsd,
      status,
    } = body;

    if (!transactionHash || !userAddress || !loanAction) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_ACTIONS.has(loanAction)) {
      return data({ error: "Invalid loan action" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO app_db.loans (
        transaction_hash, block_number, timestamp, user_address,
        action, pool_address, pool_label,
        collateral_symbol, debt_symbol,
        collateral_amount_raw, debt_amount_raw,
        amount, amount_usd, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (transaction_hash) DO NOTHING
      RETURNING id`,
      [
        transactionHash,
        blockNumber || 0,
        timestamp ? new Date(timestamp * 1000) : new Date(),
        userAddress,
        loanAction,
        poolAddress || null,
        poolLabel || null,
        collateralSymbol || null,
        debtSymbol || null,
        collateralAmountRaw || null,
        debtAmountRaw || null,
        amount || null,
        amountUsd ?? null,
        status || "completed",
      ]
    );

    return data({ success: true, id: result.rows[0]?.id });
  } catch (error) {
    console.error("Error recording loan:", error);
    return data({ error: "Failed to record loan" }, { status: 500 });
  }
}
