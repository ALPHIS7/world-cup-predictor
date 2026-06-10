-- World Cup Predictor - D1 (SQLite) schema.
-- Apply with: wrangler d1 execute worldcup --local --file=./migrations/0001_schema.sql
-- (use --remote for the deployed database)

CREATE TABLE IF NOT EXISTS users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id         INTEGER NOT NULL UNIQUE,
  username            TEXT,
  first_name          TEXT,
  last_name           TEXT,
  photo_url           TEXT,
  language_code       TEXT,
  balance             INTEGER NOT NULL DEFAULT 0,
  total_predictions   INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  exact_predictions   INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC);

CREATE TABLE IF NOT EXISTS matches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT NOT NULL UNIQUE,
  competition TEXT,
  stage       TEXT,
  home_team   TEXT NOT NULL,
  away_team   TEXT NOT NULL,
  home_code   TEXT,
  away_code   TEXT,
  home_crest  TEXT,
  away_crest  TEXT,
  kickoff_at  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'SCHEDULED',
  home_score  INTEGER,
  away_score  INTEGER,
  settled     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

CREATE TABLE IF NOT EXISTS predictions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL,
  match_id       INTEGER NOT NULL,
  predicted_home INTEGER NOT NULL,
  predicted_away INTEGER NOT NULL,
  outcome        TEXT NOT NULL,
  result         TEXT,
  coins_delta    INTEGER NOT NULL DEFAULT 0,
  settled        INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  settled_at     TEXT,
  UNIQUE (user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_unsettled ON predictions(settled);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  amount        INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  ref_type      TEXT,
  ref_id        INTEGER,
  balance_after INTEGER NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON coin_transactions(user_id);
