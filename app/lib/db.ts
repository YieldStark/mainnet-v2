import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const host = process.env.DB_HOST;
    const port = parseInt(process.env.DB_PORT || '5432');
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    
    if (!host || !user || !password || !database) {
      throw new Error('Missing required database environment variables');
    }

    pool = new Pool({
      host,
      port,
      user,
      password,
      database,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      // RDS can be slow to establish the first connection; give it headroom.
      connectionTimeoutMillis: 20000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  return pool;
}

// Transient errors worth retrying once (connection/timeouts, not SQL errors).
const TRANSIENT_DB_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EPIPE',
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08003', // connection_does_not_exist
]);

function isTransientDbError(error: any): boolean {
  const code = error?.code;
  if (code && TRANSIENT_DB_ERROR_CODES.has(code)) return true;
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('connection terminated') ||
    msg.includes('connection ended')
  );
}

export async function query(text: string, params?: any[]) {
  const pool = getDbPool();
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('[DB Query]', { text, duration, rows: res.rowCount, attempt });
      return res;
    } catch (error) {
      const canRetry = attempt < maxAttempts && isTransientDbError(error);
      console.error('[DB Query Error]', { text, attempt, canRetry, error });
      if (!canRetry) throw error;
      // Small backoff before retrying a transient failure.
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  // Unreachable, but satisfies the type checker.
  throw new Error('Query failed after retries');
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
