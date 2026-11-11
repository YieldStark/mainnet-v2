/**
 * Copy the app_db schema and all rows from a source Postgres (e.g. the old RDS
 * instance) into the target database configured by the regular DB_* vars
 * (e.g. Supabase).
 *
 * Source connection comes from SOURCE_DB_* vars; target from DB_* vars.
 * The target schema is created first by running database.sql, then every
 * table is copied in batches and BIGSERIAL sequences are advanced past the
 * highest copied id.
 *
 *   npm run db:copy-from-source            # copy, skipping rows already present
 *   npm run db:copy-from-source -- --truncate   # empty target tables first
 */
import { Pool, type PoolConfig } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// Order matters only for readability; there are no foreign keys between tables.
const TABLES = [
  'swaps',
  'deposits',
  'withdrawals',
  'loans',
  'token_prices',
  'daily_volume_stats',
  'yield_records',
];
const BATCH = 500;
const SCHEMA = 'app_db';

function poolConfig(prefix: 'SOURCE_DB' | 'DB'): PoolConfig {
  const host = process.env[`${prefix}_HOST`];
  const user = process.env[`${prefix}_USER`];
  const password = process.env[`${prefix}_PASSWORD`];
  const database = process.env[`${prefix}_NAME`];
  if (!host || !user || !password || !database) {
    console.error(`Missing ${prefix}_HOST / ${prefix}_USER / ${prefix}_PASSWORD / ${prefix}_NAME`);
    process.exit(1);
  }
  return {
    host,
    port: parseInt(process.env[`${prefix}_PORT`] || '5432'),
    user,
    password,
    database,
    ssl: process.env[`${prefix}_SSL`] === 'false' ? false : { rejectUnauthorized: false },
    max: 4,
    connectionTimeoutMillis: 20000,
  };
}

async function copyTable(source: Pool, target: Pool, table: string, truncate: boolean) {
  const fq = `${SCHEMA}.${table}`;
  const colRows = (
    await source.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
      [SCHEMA, table],
    )
  ).rows as { column_name: string; data_type: string }[];
  const cols = colRows.map((r) => r.column_name);
  if (cols.length === 0) {
    console.log(`  ${fq}: not present on source, skipped`);
    return;
  }
  const colList = cols.map((c) => `"${c}"`).join(', ');
  // Read timestamps as text: the pg driver would otherwise parse them into JS
  // Dates and silently drop microseconds. Postgres casts the text back on insert.
  const selectList = colRows
    .map((r) => (r.data_type.startsWith('timestamp') ? `"${r.column_name}"::text` : `"${r.column_name}"`))
    .join(', ');
  const total = (await source.query(`SELECT count(*)::int AS n FROM ${fq}`)).rows[0].n as number;

  if (truncate) await target.query(`TRUNCATE ${fq}`);

  let copied = 0;
  for (let offset = 0; offset < total; offset += BATCH) {
    const { rows } = await source.query(
      `SELECT ${selectList} FROM ${fq} ORDER BY id LIMIT ${BATCH} OFFSET ${offset}`,
    );
    if (rows.length === 0) break;
    const params: unknown[] = [];
    const tuples = rows.map((row) => {
      const ph = cols.map((c) => {
        params.push(row[c]);
        return `$${params.length}`;
      });
      return `(${ph.join(', ')})`;
    });
    const res = await target.query(
      `INSERT INTO ${fq} (${colList}) VALUES ${tuples.join(', ')} ON CONFLICT DO NOTHING`,
      params,
    );
    copied += res.rowCount ?? 0;
  }

  if (cols.includes('id')) {
    await target.query(
      `SELECT setval(pg_get_serial_sequence('${fq}', 'id'),
              GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${fq}), 1),
              (SELECT COUNT(*) > 0 FROM ${fq}))`,
    );
  }
  const targetCount = (await target.query(`SELECT count(*)::int AS n FROM ${fq}`)).rows[0].n;
  console.log(`  ${fq}: source=${total} inserted=${copied} target=${targetCount}`);
}

async function main() {
  const truncate = process.argv.includes('--truncate');
  const source = new Pool(poolConfig('SOURCE_DB'));
  const target = new Pool(poolConfig('DB'));
  try {
    console.log('Source:', process.env.SOURCE_DB_HOST);
    console.log('Target:', process.env.DB_HOST);

    console.log('Ensuring target schema (database.sql)...');
    await target.query(readFileSync(join(__dirname, 'database.sql'), 'utf-8'));

    console.log(`Copying tables${truncate ? ' (truncating target first)' : ''}...`);
    for (const table of TABLES) await copyTable(source, target, table, truncate);

    console.log('Done.');
  } catch (err) {
    console.error('Copy failed:', err);
    process.exitCode = 1;
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main();
