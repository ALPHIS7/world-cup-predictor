import { footballApiService } from './footballApiService.js';
import { matchRepo } from './repositories/matchRepo.js';
import { predictionRepo } from './repositories/predictionRepo.js';
import { db } from '../database/db.js';
import { logger } from '../utils/logger.js';

// Lock predictions once the match has kicked off.
function isLocked(match) {
  if (['IN_PLAY', 'PAUSED', 'FINISHED', 'CANCELLED', 'POSTPONED'].includes(match.status)) {
    return true;
  }
  return new Date(match.kickoff_at).getTime() <= Date.now();
}

// Shape a DB match row for the frontend, optionally annotated with the
// requesting user's existing prediction.
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
  // Pull latest fixtures from the API and upsert them into our DB.
  async syncFromApi() {
    const matches = await footballApiService.fetchMatches();
    const tx = db.transaction((rows) => {
      for (const m of rows) matchRepo.upsert(m);
    });
    tx(matches);
    logger.info(`Synced ${matches.length} matches (mock=${footballApiService.usingMock()}).`);
    return matches.length;
  },

  // Match list for the prediction screen, annotated with user predictions.
  listForUser(userId) {
    const matches = matchRepo.listRelevant(40);
    const predMap = userId ? predictionRepo.mapByUser(userId) : {};
    return matches.map((m) => present(m, predMap[m.id]));
  },

  getById(id, userId) {
    const match = matchRepo.findById(id);
    if (!match) return null;
    const prediction = userId
      ? predictionRepo.findByUserAndMatch(userId, id)
      : null;
    return present(match, prediction);
  },

  isLocked,
};
