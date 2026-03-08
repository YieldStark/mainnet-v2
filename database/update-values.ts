import { Pool } from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const WBTC_ADDRESS = "0x03Fe2b97C1Fd336E750087D68B9b867997Fd64a2661fF3ca5A7C771641e8e7AC";
const USDC_ADDRESS = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

const PRICES = {
  wbtc_usd: 95000,
  usdc_usd: 1,
  strk_usd: 0.5
};

function normalizeAddress(addr: string): string {
  return addr.toLowerCase().replace(/^0x0+/, '0x');
}

async function updateValues() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('Fetching deposits to update...');
    
    const result = await pool.query(`
      SELECT id, token_address, token_symbol, amount_raw 
      FROM app_db.deposits 
      WHERE amount_usd IS NULL OR amount_wbtc IS NULL OR amount_strk IS NULL
    `);
    
    console.log(`Found ${result.rows.length} deposits to update`);
    
    for (const row of result.rows) {
      const tokenAddr = normalizeAddress(row.token_address);
      const wbtcNorm = normalizeAddress(WBTC_ADDRESS);
      const usdcNorm = normalizeAddress(USDC_ADDRESS);
      const strkNorm = normalizeAddress(STRK_ADDRESS);
      
      let decimals = 6;
      let amountUsd = 0;
      let amountWbtc = 0;
      let amountStrk = 0;
      
      if (tokenAddr === wbtcNorm) {
        decimals = 8;
        const amount = Number(row.amount_raw) / (10 ** decimals);
        amountUsd = amount * PRICES.wbtc_usd;
        amountWbtc = amount;
        amountStrk = (amount * PRICES.wbtc_usd) / PRICES.strk_usd;
      } else if (tokenAddr === usdcNorm) {
        decimals = 6;
        const amount = Number(row.amount_raw) / (10 ** decimals);
        amountUsd = amount * PRICES.usdc_usd;
        amountWbtc = (amount * PRICES.usdc_usd) / PRICES.wbtc_usd;
        amountStrk = (amount * PRICES.usdc_usd) / PRICES.strk_usd;
      } else if (tokenAddr === strkNorm) {
        decimals = 18;
        const amount = Number(row.amount_raw) / (10 ** decimals);
        amountUsd = amount * PRICES.strk_usd;
        amountWbtc = (amount * PRICES.strk_usd) / PRICES.wbtc_usd;
        amountStrk = amount;
      }
      
      await pool.query(`
        UPDATE app_db.deposits 
        SET amount_usd = $1, amount_wbtc = $2, amount_strk = $3
        WHERE id = $4
      `, [amountUsd, amountWbtc, amountStrk, row.id]);
      
      console.log(`Updated deposit ${row.id}: ${row.token_symbol} -> $${amountUsd.toFixed(2)}`);
    }
    
    console.log('Update completed!');
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateValues();
