-- World Cup Predictor - Database Schema (SQLite)
-- Designed to be extended: tournaments, clans, shop, missions, etc.
-- All money/score values are plain integers (coins).

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- USERS
-- One row per Telegram user. balance can go negative by design.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id       INTEGER NOT NULL UNIQUE,
  username          TEXT,
  first_name        TEXT,
  last_name         TEXT,
  photo_url         TEXT,
  language_code     TEXT,
  balance           INTEGER NOT NULL DEFAULT 0,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  exact_predictions INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC);

-- ---------------------------------------------------------------------------
-- MATCHES
-- Mirror of football API fixtures. external_id is the provider's match id.
-- status: SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | POSTPONED | CANCELLED
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id   TEXT NOT NULL UNIQUE,
  competition   TEXT,
  stage         TEXT,
  home_team     TEXT NOT NULL,
  away_team     TEXT NOT NULL,
  home_code     TEXT,            -- ISO-ish code used to render flags, e.g. "ar"
  away_code     TEXT,
  home_crest    TEXT,            -- optional crest/flag image url
  away_crest    TEXT,
  kickoff_at    TEXT NOT NULL,   -- ISO datetime (UTC)
  status        TEXT NOT NULL DEFAULT 'SCHEDULED',
  home_score    INTEGER,         -- null until known
  away_score    INTEGER,
  settled       INTEGER NOT NULL DEFAULT 0,  -- 1 once predictions paid out
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- ---------------------------------------------------------------------------
-- PREDICTIONS
-- One prediction per (user, match) enforced by UNIQUE constraint.
-- outcome: 'HOME' | 'AWAY' | 'DRAW' (derived, stored for fast scoring)
-- result:  null until settled, then 'CORRECT_EXACT' | 'CORRECT_WINNER' | 'WRONG'
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  match_id        INTEGER NOT NULL,
  predicted_home  INTEGER NOT NULL,
  predicted_away  INTEGER NOT NULL,
  outcome         TEXT NOT NULL,
  result          TEXT,
  coins_delta     INTEGER NOT NULL DEFAULT 0,
  settled         INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  settled_at      TEXT,
  UNIQUE (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_unsettled ON predictions(settled);

-- ---------------------------------------------------------------------------
-- COIN_TRANSACTIONS
-- Append-only ledger. Future features (shop, rewards, missions) write here too.
-- reason: 'PREDICTION_SETTLED' | 'DAILY_REWARD' | 'SHOP_PURCHASE' | ...
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coin_transactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  amount       INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  ref_type     TEXT,             -- e.g. 'prediction'
  ref_id       INTEGER,          -- e.g. prediction id
  balance_after INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON coin_transactions(user_id);
