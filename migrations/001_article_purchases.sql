-- Migration: Create article_purchases table for individual article purchases
-- Run this against your Turso database

CREATE TABLE IF NOT EXISTS article_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER NOT NULL,
  article_slug TEXT NOT NULL,
  payment_token TEXT NOT NULL,
  price_usd REAL NOT NULL,
  purchased_at INTEGER DEFAULT (strftime('%s','now')),
  UNIQUE(wallet_id, article_slug),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Index for fast lookups by wallet and slug
CREATE INDEX IF NOT EXISTS idx_article_purchases_wallet_slug
ON article_purchases(wallet_id, article_slug);
