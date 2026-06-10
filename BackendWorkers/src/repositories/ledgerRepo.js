// Append-only coin ledger. Every balance change should be recorded here.
export const ledgerRepo = {
  recordStmt(db, { userId, amount, reason, refType = null, refId = null, balanceAfter }) {
    return db
      .prepare(`INSERT INTO coin_transactions (user_id, amount, reason, ref_type, ref_id, balance_after)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(userId, amount, reason, refType, refId, balanceAfter);
  },
};
