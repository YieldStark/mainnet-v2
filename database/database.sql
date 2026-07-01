CREATE SCHEMA IF NOT EXISTS app_db;

CREATE TABLE IF NOT EXISTS app_db.swaps (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_address VARCHAR(66) NOT NULL,
    token_in VARCHAR(66) NOT NULL,
    token_out VARCHAR(66) NOT NULL,
    amount_in NUMERIC(78, 0) NOT NULL,
    amount_out NUMERIC(78, 0) NOT NULL,
    volume_wbtc NUMERIC(18, 8),
    volume_usd NUMERIC(18, 2),
    volume_strk NUMERIC(18, 8),
    pool_address VARCHAR(66),
    protocol VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swaps_timestamp ON app_db.swaps(timestamp);
CREATE INDEX IF NOT EXISTS idx_swaps_user_address ON app_db.swaps(user_address);
CREATE INDEX IF NOT EXISTS idx_swaps_block_number ON app_db.swaps(block_number);

CREATE TABLE IF NOT EXISTS app_db.deposits (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_address VARCHAR(66) NOT NULL,
    token_address VARCHAR(66) NOT NULL,
    token_symbol VARCHAR(10),
    amount_raw NUMERIC(78, 0) NOT NULL,
    amount_wbtc NUMERIC(18, 8),
    amount_usd NUMERIC(18, 2),
    amount_strk NUMERIC(18, 8),
    status VARCHAR(20) DEFAULT 'completed',
    pool_address VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deposits_timestamp ON app_db.deposits(timestamp);
CREATE INDEX IF NOT EXISTS idx_deposits_user_address ON app_db.deposits(user_address);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON app_db.deposits(status);

CREATE TABLE IF NOT EXISTS app_db.withdrawals (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    user_address VARCHAR(66) NOT NULL,
    token_address VARCHAR(66) NOT NULL,
    token_symbol VARCHAR(10),
    amount_raw NUMERIC(78, 0) NOT NULL,
    amount_wbtc NUMERIC(18, 8),
    amount_usd NUMERIC(18, 2),
    amount_strk NUMERIC(18, 8),
    status VARCHAR(20) DEFAULT 'completed',
    pool_address VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_timestamp ON app_db.withdrawals(timestamp);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_address ON app_db.withdrawals(user_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON app_db.withdrawals(status);

-- Vesu loan (borrow) activity: borrow / repay / withdraw_collateral.
CREATE TABLE IF NOT EXISTS app_db.loans (
    id BIGSERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT DEFAULT 0,
    timestamp TIMESTAMP NOT NULL,
    user_address VARCHAR(66) NOT NULL,
    action VARCHAR(30) NOT NULL, -- borrow | repay | withdraw_collateral
    pool_address VARCHAR(66),
    pool_label VARCHAR(100),
    collateral_symbol VARCHAR(20),
    debt_symbol VARCHAR(20),
    collateral_amount_raw NUMERIC(78, 0),
    debt_amount_raw NUMERIC(78, 0),
    amount TEXT, -- human-readable summary
    amount_usd NUMERIC(18, 2),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_timestamp ON app_db.loans(timestamp);
CREATE INDEX IF NOT EXISTS idx_loans_user_address ON app_db.loans(user_address);
CREATE INDEX IF NOT EXISTS idx_loans_action ON app_db.loans(action);
CREATE INDEX IF NOT EXISTS idx_loans_pool_address ON app_db.loans(pool_address);

CREATE TABLE IF NOT EXISTS app_db.token_prices (
    id BIGSERIAL PRIMARY KEY,
    token_address VARCHAR(66) NOT NULL,
    token_symbol VARCHAR(10) NOT NULL,
    price_usd NUMERIC(18, 8),
    price_wbtc NUMERIC(18, 8),
    price_strk NUMERIC(18, 8),
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (token_address, timestamp, source)
);

CREATE INDEX IF NOT EXISTS idx_token_prices_token_timestamp ON app_db.token_prices(token_address, timestamp);

CREATE TABLE IF NOT EXISTS app_db.daily_volume_stats (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_swaps_count INTEGER DEFAULT 0,
    total_swap_volume_wbtc NUMERIC(18, 8) DEFAULT 0,
    total_swap_volume_usd NUMERIC(18, 2) DEFAULT 0,
    total_swap_volume_strk NUMERIC(18, 8) DEFAULT 0,
    total_deposits_count INTEGER DEFAULT 0,
    total_deposit_amount_wbtc NUMERIC(18, 8) DEFAULT 0,
    total_deposit_amount_usd NUMERIC(18, 2) DEFAULT 0,
    total_deposit_amount_strk NUMERIC(18, 8) DEFAULT 0,
    unique_users_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_volume_stats_date ON app_db.daily_volume_stats(date);

CREATE TABLE IF NOT EXISTS app_db.yield_records (
    id BIGSERIAL PRIMARY KEY,
    user_address VARCHAR(66) NOT NULL,
    pool_address VARCHAR(66) NOT NULL,
    yield_amount_raw NUMERIC(78, 0) NOT NULL,
    yield_token_address VARCHAR(66) NOT NULL,
    yield_amount_wbtc NUMERIC(18, 8),
    yield_amount_usd NUMERIC(18, 2),
    yield_amount_strk NUMERIC(18, 8),
    timestamp TIMESTAMP NOT NULL,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_yield_records_user_address ON app_db.yield_records(user_address);
CREATE INDEX IF NOT EXISTS idx_yield_records_timestamp ON app_db.yield_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_yield_records_pool_address ON app_db.yield_records(pool_address);

CREATE OR REPLACE VIEW app_db.yield_page_stats AS
SELECT 
    COUNT(DISTINCT d.id) as total_deposits,
    COUNT(DISTINCT d.user_address) as unique_depositors,
    SUM(d.amount_wbtc) as total_deposit_wbtc,
    SUM(d.amount_usd) as total_deposit_usd,
    SUM(d.amount_strk) as total_deposit_strk,
    SUM(s.volume_wbtc) as total_volume_wbtc,
    SUM(s.volume_usd) as total_volume_usd,
    SUM(s.volume_strk) as total_volume_strk,
    COUNT(DISTINCT s.id) as total_swaps,
    SUM(y.yield_amount_wbtc) as total_yield_wbtc,
    SUM(y.yield_amount_usd) as total_yield_usd,
    SUM(y.yield_amount_strk) as total_yield_strk
FROM app_db.deposits d
LEFT JOIN app_db.swaps s ON DATE(d.timestamp) = DATE(s.timestamp)
LEFT JOIN app_db.yield_records y ON DATE(d.timestamp) = DATE(y.timestamp);