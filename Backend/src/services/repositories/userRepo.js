import { db } from '../../database/db.js';

// All SQL touching `users` lives here. Services call these, never raw SQL.
export const userRepo = {
  findByTelegramId(telegramId) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  create(user) {
    const stmt = db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, language_code)
      VALUES (@telegram_id, @username, @first_name, @last_name, @photo_url, @language_code)
    `);
    const info = stmt.run(user);
    return this.findById(info.lastInsertRowid);
  },

  // Refresh profile fields from the latest Telegram payload on each login.
  updateProfile(id, user) {
    db.prepare(`
      UPDATE users SET
        username = @username,
        first_name = @first_name,
        last_name = @last_name,
        photo_url = @photo_url,
        language_code = @language_code,
        updated_at = datetime('now')
      WHERE id = @id
    `).run({ ...user, id });
    return this.findById(id);
  },

  // Atomically change balance and return the new value.
  addBalance(id, delta) {
    db.prepare(
      `UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?`
    ).run(delta, id);
    return this.findById(id).balance;
  },

  incrementStats(id, { correct, exact }) {
    db.prepare(`
      UPDATE users SET
        total_predictions = total_predictions + 1,
        correct_predictions = correct_predictions + ?,
        exact_predictions = exact_predictions + ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(correct ? 1 : 0, exact ? 1 : 0, id);
  },

  // Rank = position when ordered by balance desc. 1-based.
  getRank(id) {
    const row = db.prepare(`
      SELECT COUNT(*) + 1 AS rank
      FROM users
      WHERE balance > (SELECT balance FROM users WHERE id = ?)
    `).get(id);
    return row.rank;
  },

  totalUsers() {
    return db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  },

  leaderboard(limit = 50, offset = 0) {
    return db.prepare(`
      SELECT id, telegram_id, username, first_name, photo_url, balance,
             total_predictions, correct_predictions
      FROM users
      ORDER BY balance DESC, correct_predictions DESC, id ASC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },
};
