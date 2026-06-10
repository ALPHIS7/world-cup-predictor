export const predictionRepo = {
  findByUserAndMatch(db, userId, matchId) {
    return db
      .prepare('SELECT * FROM predictions WHERE user_id = ? AND match_id = ?')
      .bind(userId, matchId)
      .first();
  },

  async create(db, p) {
    const res = await db
      .prepare(`INSERT INTO predictions (user_id, match_id, predicted_home, predicted_away, outcome)
                VALUES (?, ?, ?, ?, ?)`)
      .bind(p.user_id, p.match_id, p.predicted_home, p.predicted_away, p.outcome)
      .run();
    return db.prepare('SELECT * FROM predictions WHERE id = ?').bind(res.meta.last_row_id).first();
  },

  async listByUser(db, userId, limit = 50) {
    const res = await db
      .prepare(`SELECT p.*, m.home_team, m.away_team, m.home_code, m.away_code,
                  m.kickoff_at, m.status AS match_status,
                  m.home_score AS actual_home, m.away_score AS actual_away
                FROM predictions p
                JOIN matches m ON m.id = p.match_id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT ?`)
      .bind(userId, limit)
      .all();
    return res.results;
  },

  async mapByUser(db, userId) {
    const res = await db.prepare('SELECT * FROM predictions WHERE user_id = ?').bind(userId).all();
    const map = {};
    for (const r of res.results) map[r.match_id] = r;
    return map;
  },

  async listUnsettledForMatch(db, matchId) {
    const res = await db
      .prepare('SELECT * FROM predictions WHERE match_id = ? AND settled = 0')
      .bind(matchId)
      .all();
    return res.results;
  },

  settleStmt(db, id, { result, coinsDelta }) {
    return db
      .prepare(`UPDATE predictions SET result = ?, coins_delta = ?, settled = 1,
                  settled_at = datetime('now') WHERE id = ?`)
      .bind(result, coinsDelta, id);
  },
};
