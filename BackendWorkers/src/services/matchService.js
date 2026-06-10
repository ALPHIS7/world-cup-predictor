import { footballApiService } from './footballApiService.js';
import { matchRepo } from '../repositories/matchRepo.js';
import { predictionRepo } from '../repositories/predictionRepo.js';

// Lock predictions once the match has kicked off.
export function isLocked(match) {
  if (['IN_PLAY', 'PAUSED', 'FINISHED', 'CANCELLED', 'POSTPONED'].includes(match.status)) {
    return true;
  }
  return new Date(match.kickoff_at).getTime() <= Date.now();
}

function present(match, prediction) {
  return {
    id: match.id,
    externalId: match.external_id,
    stage: match.stage,
    competition: match.competition,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeCode: match.home_code,
    awayCode: match.away_code,
    homeCrest: match.home_crest,
    awayCrest: match.away_crest,
    kickoffAt: match.kickoff_at,
    status: match.status,
    homeScore: match.home_score,
    awayScore: match.away_score,
    locked: isLocked(match),
    prediction: prediction
      ? {
          home: prediction.predicted_home,
          away: prediction.predicted_away,
          outcome: prediction.outcome,
          result: prediction.result,
          coinsDelta: prediction.coins_delta,
          settled: !!prediction.settled,
        }
      : null,
  };
}

export const matchService = {
  // Pull latest fixtures and upsert them via a single D1 batch.
  async syncFromApi(db, config) {
    const matches = await footballApiService.fetchMatches(config);
    if (matches.length) {
      const stmts = matches.map((m) => matchRepo.upsertStmt(db, m));
      await db.batch(stmts);
    }
    return matches.length;
  },

  async listForUser(db, userId) {
    const matches = await matchRepo.listRelevant(db, 40);
    const predMap = userId ? await predictionRepo.mapByUser(db, userId) : {};
    return matches.map((m) => present(m, predMap[m.id]));
  },
};
