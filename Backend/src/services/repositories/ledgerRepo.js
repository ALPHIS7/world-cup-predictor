import { db } from '../../database/db.js';

// Append-only coin ledger. Every balance change should be recorded here.
export const ledgerRepo = {
  record({ userId, amount, reason, refType = null, refId = null, balanceAfter }) {
    db.prepare(`
      INSERT INTO coin_transactions (user_id, amount, reason, ref_type, ref_id, balance_after)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, amount, reason, refType, refId, balanceAfter);
  },

  listByUser(userId, limit = 50) {
    return db
      .prepare('SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?')
      .all(userId, limit);
  },
};
