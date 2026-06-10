import { db } from '../../database/db.js';

export const predictionRepo = {
  findByUserAndMatch(userId, matchId) {
    return db
      .prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?')
      .get(userId, matchId);
  },

  create(p) {
    const stmt = db.prepare(`
      INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, outcome)
      VALUES (@user_id, @match_id, @predicted_home, @predicted_away, @outcome)
    `);
    const info = stmt.run(p);
    return db.prepare('SELECT * FROM predictions WHERE id = ?').get(info.lastInsertRowid);
  },

  // Predictions for a user, joined with match info for display.
  listByUser(userId, limit = 50) {
    return db.prepare(`
      SELECT p.*, m.home_team, m.away_team, m.home_code, m.away_code,
             m.kickoff_at, m.status AS match_status,
             m.home_score AS actual_home, m.away_score AS actual_away
      FROM predictions p
      JOIN matches m ON m.id = p.match_id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(userId, limit);
  },

  // Map of match_id -> prediction for a given user (used to annotate match list).
  mapByUser(userId) {
    const rows = db
      .prepare('SELECT * FROM predictions WHERE user_id = ?')
      .all(userId);
    const map = {};
    for (const r of rows) map[r.match_id] = r;
    return map;
  },

  listUnsettledForMatch(matchId) {
    return db
      .prepare('SELECT * FROM predictions WHERE match_id = ? AND settled = 0')
      .all(matchId);
  },

  settle(id, { result, coinsDelta }) {
    db.prepare(`
      UPDATE predictions
      SET result = ?, coins_delta = ?, settled = 1, settled_at = datetime('now')
      WHERE id = ?
    `).run(result, coinsDelta, id);
  },
};
