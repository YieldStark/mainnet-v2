import { data } from "react-router";
import { query } from "~/lib/db";

export async function loader() {
  try {
    const result = await query(`
      SELECT 
        (SELECT COUNT(*) FROM app_db.swaps) as swap_count,
        (SELECT COUNT(*) FROM app_db.deposits) as deposit_count,
        NOW() as server_time
    `);
    
    return data({ 
      success: true, 
      data: result.rows[0],
      message: 'Database connection successful'
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return data(
      { 
        success: false,
        error: error.message,
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}
