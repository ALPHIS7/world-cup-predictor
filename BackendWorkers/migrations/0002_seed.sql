-- Optional demo data so the leaderboard and match list aren't empty.
-- Apply with: wrangler d1 execute worldcup --local --file=./migrations/0002_seed.sql
-- Matches use relative datetimes; the cron sync will keep them updated.

INSERT OR IGNORE INTO users
  (telegram_id, username, first_name, balance, total_predictions, correct_predictions, exact_predictions)
VALUES
  (900001, 'lionel_fan',  'Leo',   145, 20, 12, 3),
  (900002, 'samba_queen', 'Ana',   110, 18, 10, 2),
  (900003, 'der_kaiser',  'Max',    85, 15,  8, 1),
  (900004, 'tiki_taka',   'Pablo',  60, 12,  6, 1),
  (900005, 'three_lions', 'Harry', -15, 10,  3, 0);

INSERT OR IGNORE INTO matches
  (external_id, competition, stage, home_team, away_team, home_code, away_code, kickoff_at, status, home_score, away_score)
VALUES
  ('mock-1', 'WC', 'GROUP_STAGE', 'Argentina', 'Brazil',     'ar', 'br', datetime('now','-3 hours'),    'FINISHED', 2, 1),
  ('mock-2', 'WC', 'GROUP_STAGE', 'France',    'Germany',    'fr', 'de', datetime('now','-30 minutes'), 'IN_PLAY',  1, 1),
  ('mock-3', 'WC', 'GROUP_STAGE', 'Spain',     'Portugal',   'es', 'pt', datetime('now','+2 hours'),    'TIMED',    NULL, NULL),
  ('mock-4', 'WC', 'GROUP_STAGE', 'England',   'Netherlands','gb', 'nl', datetime('now','+5 hours'),    'TIMED',    NULL, NULL),
  ('mock-5', 'WC', 'GROUP_STAGE', 'Croatia',   'Morocco',    'hr', 'ma', datetime('now','+26 hours'),   'SCHEDULED',NULL, NULL),
  ('mock-6', 'WC', 'GROUP_STAGE', 'Japan',     'Mexico',     'jp', 'mx', datetime('now','+28 hours'),   'SCHEDULED',NULL, NULL);
