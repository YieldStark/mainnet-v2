import { data } from "react-router";
import type { Route } from "./+types/api.stats";
import { query } from "~/lib/db";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'yield_page') {
      const result = await query(`SELECT * FROM app_db.yield_page_stats`);
      return data({ stats: result.rows[0] || null });
    }

    if (type === 'daily_volume') {
      const days = parseInt(url.searchParams.get('days') || '30');
      const result = await query(
        `SELECT * FROM app_db.daily_volume_stats 
         WHERE date >= CURRENT_DATE - $1 
         ORDER BY date DESC`,
        [days]
      );
      return data({ stats: result.rows });
    }

    if (type === 'recent_swaps') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const result = await query(
        `SELECT * FROM app_db.swaps 
         ORDER BY timestamp DESC 
         LIMIT $1`,
        [limit]
      );
      return data({ swaps: result.rows });
    }

    if (type === 'recent_deposits') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const result = await query(
        `SELECT * FROM app_db.deposits 
         ORDER BY timestamp DESC 
         LIMIT $1`,
        [limit]
      );
      return data({ deposits: result.rows });
    }

    return data({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return data(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
