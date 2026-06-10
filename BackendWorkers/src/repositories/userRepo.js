// All SQL touching `users`. D1 is async; every method returns a promise.
// `db` is the D1 binding (env.DB), passed in by the service layer.
export const userRepo = {
  findByTelegramId(db, telegramId) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first();
  },

  findById(db, id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  },

  async create(db, u) {
    const res = await db
      .prepare(`INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, language_code)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(u.telegram_id, u.username, u.first_name, u.last_name, u.photo_url, u.language_code)
      .run();
    return this.findById(db, res.meta.last_row_id);
  },

  async updateProfile(db, id, u) {
    await db
      .prepare(`UPDATE users SET username = ?, first_name = ?, last_name = ?, photo_url = ?,
                  language_code = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(u.username, u.first_name, u.last_name, u.photo_url, u.language_code, id)
      .run();
    return this.findById(db, id);
  },

  // Statement builders (for db.batch atomic settlement).
  addBalanceStmt(db, id, delta) {
    return db
      .prepare(`UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(delta, id);
  },

  incrementStatsStmt(db, id, { correct, exact }) {
    return db
      .prepare(`UPDATE users SET total_predictions = total_predictions + 1,
                  correct_predictions = correct_predictions + ?,
                  exact_predictions = exact_predictions + ?,
                  updated_at = datetime('now') WHERE id = ?`)
      .bind(correct ? 1 : 0, exact ? 1 : 0, id);
  },

  async getRank(db, id) {
    const row = await db
      .prepare(`SELECT COUNT(*) + 1 AS rank FROM users
                WHERE balance > (SELECT balance FROM users WHERE id = ?)`)
      .bind(id)
      .first();
    return row.rank;
  },

  async totalUsers(db) {
    return (await db.prepare('SELECT COUNT(*) AS c FROM users').first()).c;
  },

  async leaderboard(db, limit = 50, offset = 0) {
    const res = await db
      .prepare(`SELECT id, telegram_id, username, first_name, photo_url, balance,
                  total_predictions, correct_predictions
                FROM users
                ORDER BY balance DESC, correct_predictions DESC, id ASC
                LIMIT ? OFFSET ?`)
      .bind(limit, offset)
      .all();
    return res.results;
  },
};
