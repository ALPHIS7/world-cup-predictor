// Run: npm run seed
// Inserts mock matches + a few demo users so the leaderboard isn't empty.
import { db } from './db.js';
import { buildMockMatches } from './mockMatches.js';
import { matchRepo } from '../services/repositories/matchRepo.js';
import { logger } from '../utils/logger.js';

const demoUsers = [
  { telegram_id: 900001, username: 'lionel_fan', first_name: 'Leo', balance: 145, total_predictions: 20, correct_predictions: 12, exact_predictions: 3 },
  { telegram_id: 900002, username: 'samba_queen', first_name: 'Ana', balance: 110, total_predictions: 18, correct_predictions: 10, exact_predictions: 2 },
  { telegram_id: 900003, username: 'der_kaiser', first_name: 'Max', balance: 85, total_predictions: 15, correct_predictions: 8, exact_predictions: 1 },
  { telegram_id: 900004, username: 'tiki_taka', first_name: 'Pablo', balance: 60, total_predictions: 12, correct_predictions: 6, exact_predictions: 1 },
  { telegram_id: 900005, username: 'three_lions', first_name: 'Harry', balance: -15, total_predictions: 10, correct_predictions: 3, exact_predictions: 0 },
];

try {
  const upsertUser = db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, balance, total_predictions, correct_predictions, exact_predictions)
    VALUES (@telegram_id, @username, @first_name, @balance, @total_predictions, @correct_predictions, @exact_predictions)
    ON CONFLICT(telegram_id) DO UPDATE SET
      balance=excluded.balance,
      total_predictions=excluded.total_predictions,
      correct_predictions=excluded.correct_predictions,
      exact_predictions=excluded.exact_predictions
  `);
  const tx = db.transaction(() => {
    for (const u of demoUsers) upsertUser.run(u);
    for (const m of buildMockMatches()) matchRepo.upsert(m);
  });
  tx();

  logger.info(`Seeded ${demoUsers.length} users and mock matches.`);
  process.exit(0);
} catch (err) {
  logger.error('Seed failed:', err);
  process.exit(1);
}
