import { data } from "react-router";
import { query } from "~/lib/db";

export async function loader() {
  try {
    const deposits = await query(`SELECT * FROM app_db.deposits ORDER BY created_at DESC LIMIT 5`);
    const swaps = await query(`SELECT * FROM app_db.swaps ORDER BY created_at DESC LIMIT 5`);
    const stats = await query(`SELECT * FROM app_db.yield_page_stats`);
    
    return data({ 
      deposits: deposits.rows,
      swaps: swaps.rows,
      stats: stats.rows[0]
    });
  } catch (error: any) {
    console.error("Check data error:", error);
    return data({ error: error.message }, { status: 500 });
  }
}
