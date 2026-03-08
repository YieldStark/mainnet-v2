# Database Setup

This directory contains the PostgreSQL database schema for tracking swaps, deposits, and yield statistics.

## Prerequisites

- PostgreSQL database (AWS RDS or local)
- Node.js environment with npm

## Setup

1. **Configure environment variables**

Create a `.env` file in the project root with your database credentials:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

See `.env.example` for the template.

2. **Run migrations**

```bash
npm run db:migrate
```

This will create the following tables in the `app_db` schema:

- `swaps` - Individual swap transactions with volume tracking
- `deposits` - Deposit records with multi-currency amounts
- `token_prices` - Token price history for conversions
- `daily_volume_stats` - Aggregated daily statistics
- `yield_records` - Yield/rewards tracking
- `yield_page_stats` (view) - Statistics for the yield page

## Schema Overview

### Tables

**app_db.swaps**
- Tracks every swap transaction
- Records volume in WBTC, USD, and STRK
- Indexed on timestamp, user_address, block_number

**app_db.deposits**
- Tracks all deposits
- Stores amounts in multiple currencies
- Indexed on timestamp, user_address, status

**app_db.token_prices**
- Historical token price data
- Used for currency conversions
- Indexed on token_address and timestamp

**app_db.daily_volume_stats**
- Pre-aggregated daily statistics
- Improves query performance for dashboards
- Updated daily via cron or application logic

**app_db.yield_records**
- Tracks yield/rewards earned
- Multi-currency value tracking
- Indexed on user_address, timestamp, pool_address

### Views

**app_db.yield_page_stats**
- Aggregates deposits, swaps, and yields
- Provides counts and totals in WBTC, USD, STRK
- Used for the yield page dashboard

## API Endpoints

The application automatically records transactions:

- `POST /api/swap` - Records swap transactions
- `POST /api/deposit` - Records deposit transactions
- `GET /api/stats?type=yield_page` - Fetch yield page statistics
- `GET /api/stats?type=daily_volume&days=30` - Fetch daily volume stats
- `GET /api/stats?type=recent_swaps&limit=100` - Fetch recent swaps
- `GET /api/stats?type=recent_deposits&limit=100` - Fetch recent deposits

## Manual Queries

Connect to your database:

```bash
psql "postgresql://user:password@host:5432/dbname?sslmode=require"
```

Example queries:

```sql
-- Get total volume today
SELECT 
  total_swap_volume_usd,
  total_deposits_count,
  total_deposit_amount_usd
FROM app_db.daily_volume_stats
WHERE date = CURRENT_DATE;

-- Get recent swaps
SELECT * FROM app_db.swaps 
ORDER BY timestamp DESC 
LIMIT 10;

-- Get yield page stats
SELECT * FROM app_db.yield_page_stats;
```
