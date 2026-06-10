export const matchRepo = {
  // Build the upsert statement for one fixture (used standalone or in a batch).
  upsertStmt(db, m) {
    return db
      .prepare(`INSERT INTO matches (
          external_id, competition, stage, home_team, away_team,
          home_code, away_code, home_crest, away_crest,
          kickoff_at, status, home_score, away_score, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(external_id) DO UPDATE SET
          status = excluded.status,
          home_score = excluded.home_score,
          away_score = excluded.away_score,
          kickoff_at = excluded.kickoff_at,
          stage = excluded.stage,
          updated_at = datetime('now')`)
      .bind(
        m.external_id, m.competition ?? 'WC', m.stage ?? null, m.home_team, m.away_team,
        m.home_code ?? null, m.away_code ?? null, m.home_crest ?? null, m.away_crest ?? null,
        m.kickoff_at, m.status ?? 'SCHEDULED', m.home_score ?? null, m.away_score ?? null
      );
  },

  findById(db, id) {
    return db.prepare('SELECT * FROM matches WHERE id = ?').bind(id).first();
  },

  async listRelevant(db, limit = 40) {
    const res = await db
      .prepare(`SELECT * FROM matches
                ORDER BY CASE status
                    WHEN 'IN_PLAY' THEN 0 WHEN 'PAUSED' THEN 0
                    WHEN 'TIMED' THEN 1 WHEN 'SCHEDULED' THEN 1 ELSE 2 END,
                  kickoff_at ASC
                LIMIT ?`)
      .bind(limit)
      .all();
    return res.results;
  },

  async listSettleable(db) {
    const res = await db
      .prepare(`SELECT * FROM matches
                WHERE status = 'FINISHED' AND home_score IS NOT NULL
                  AND away_score IS NOT NULL AND settled = 0`)
      .all();
    return res.results;
  },

  markSettledStmt(db, id) {
    return db
      .prepare(`UPDATE matches SET settled = 1, updated_at = datetime('now') WHERE id = ?`)
      .bind(id);
  },

  async countToday(db) {
    const row = await db
      .prepare(`SELECT COUNT(*) AS c FROM matches WHERE date(kickoff_at) = date('now')`)
      .first();
    return row.c;
  },
};
