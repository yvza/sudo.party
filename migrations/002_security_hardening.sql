-- Migration: Security hardening tables for payment system
-- Run this against your Turso database

-- Audit log for security events (purchases, failures, suspicious activity)
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  ip TEXT,
  wallet_address TEXT,
  wallet_id INTEGER,
  article_slug TEXT,
  amount REAL,
  token TEXT,
  reason TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Index for efficient queries on audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_type_time ON audit_log(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_wallet ON audit_log(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON audit_log(ip);

-- Enhanced payment_outbox table (if not exists, create with new columns)
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
-- So we create the table fresh if it doesn't exist

CREATE TABLE IF NOT EXISTS payment_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  wallet_id INTEGER NOT NULL,
  article_slug TEXT,
  expected_price REAL,
  payment_hash TEXT,
  hash_timestamp INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Index for payment outbox lookups
CREATE INDEX IF NOT EXISTS idx_payment_outbox_token ON payment_outbox(token);
CREATE INDEX IF NOT EXISTS idx_payment_outbox_wallet ON payment_outbox(wallet_id);

-- Rate limiting table (persistent across restarts)
CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Cleanup job: delete expired rate limit entries (run periodically or via trigger)
-- DELETE FROM rate_limits WHERE reset_at < strftime('%s','now');

-- Cleanup job: delete old audit logs (keep 90 days)
-- DELETE FROM audit_log WHERE created_at < strftime('%s','now') - (90 * 24 * 3600);
