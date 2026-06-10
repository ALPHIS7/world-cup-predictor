import { db } from '../../database/db.js';

export const matchRepo = {
  // Insert or update a fixture coming from the football API / mock data.
  upsert(m) {
    db.prepare(`
      INSERT INTO matches (
        external_id, competition, stage, home_team, away_team,
        home_code, away_code, home_crest, away_crest,
        kickoff_at, status, home_score, away_score, updated_at
      ) VALUES (
        @external_id, @competition, @stage, @home_team, @away_team,
        @home_code, @away_code, @home_crest, @away_crest,
        @kickoff_at, @status, @home_score, @away_score, datetime('now')
      )
      ON CONFLICT(external_id) DO UPDATE SET
        status = excluded.status,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        kickoff_at = excluded.kickoff_at,
        stage = excluded.stage,
        updated_at = datetime('now')
    `).run({
      home_crest: null,
      away_crest: null,
      home_score: null,
      away_score: null,
      stage: null,
      competition: 'WC',
      ...m,
    });
  },

  findByExternalId(externalId) {
    return db.prepare('SELECT * FROM matches WHERE external_id = ?').get(externalId);
  },

  findById(id) {
    return db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
  },

  // Upcoming + live + recently finished, ordered for the prediction screen.
  listRelevant(limit = 30) {
    return db.prepare(`
      SELECT * FROM matches
      ORDER BY
        CASE status
          WHEN 'IN_PLAY' THEN 0
          WHEN 'PAUSED' THEN 0
          WHEN 'TIMED' THEN 1
          WHEN 'SCHEDULED' THEN 1
          ELSE 2
        END,
        kickoff_at ASC
      LIMIT ?
    `).all(limit);
  },

  // Finished matches with a real score that still have unsettled predictions.
  listSettleable() {
    return db.prepare(`
      SELECT * FROM matches
      WHERE status = 'FINISHED'
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
        AND settled = 0
    `).all();
  },

  markSettled(id) {
    db.prepare(`UPDATE matches SET settled = 1, updated_at = datetime('now') WHERE id = ?`).run(id);
  },

  countToday() {
    return db.prepare(`
      SELECT COUNT(*) AS c FROM matches
      WHERE date(kickoff_at) = date('now')
    `).get().c;
  },
};
