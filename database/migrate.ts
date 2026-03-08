import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function runMigration() {
  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '5432');
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  
  if (!host || !user || !password || !database) {
    console.error('Missing required database environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('Connecting to database...');
    
    const sqlFile = readFileSync(join(__dirname, 'database.sql'), 'utf-8');
    
    console.log('Running migration...');
    await pool.query(sqlFile);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
