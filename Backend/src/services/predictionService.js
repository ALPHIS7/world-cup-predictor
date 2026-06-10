import { db } from '../database/db.js';
import { matchRepo } from './repositories/matchRepo.js';
import { predictionRepo } from './repositories/predictionRepo.js';
import { userRepo } from './repositories/userRepo.js';
import { ledgerRepo } from './repositories/ledgerRepo.js';
import { outcomeOf, scorePrediction } from './scoringService.js';
import { matchService } from './matchService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const predictionService = {
  // Create a prediction. Enforces: match exists, not locked, no duplicate,
  // valid scores. Returns the stored prediction.
  create(userId, matchId, predictedHome, predictedAway) {
    const match = matchRepo.findById(matchId);
    if (!match) throw ApiError.notFound('Match not found');
    if (matchService.isLocked(match)) {
      throw ApiError.forbidden('Match already started - predictions are locked');
    }

    const h = Number(predictedHome);
    const a = Number(predictedAway);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 30 || a > 30) {
      throw ApiError.badRequest('Scores must be integers between 0 and 30');
    }

    const existing = predictionRepo.findByUserAndMatch(userId, matchId);
    if (existing) throw ApiError.conflict('You already predicted this match');

    const outcome = outcomeOf(h, a);
    try {
      return predictionRepo.create({
        user_id: userId,
        match_id: matchId,
        predicted_home: h,
        predicted_away: a,
        outcome,
      });
    } catch (err) {
      // UNIQUE(user_id, match_id) race -> conflict
      if (String(err.message).includes('UNIQUE')) {
        throw ApiError.conflict('You already predicted this match');
      }
      throw err;
    }
  },

  listForUser(userId, limit = 50) {
    return predictionRepo.listByUser(userId, limit).map((p) => ({
      id: p.id,
      match: {
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        homeCode: p.home_code,
        awayCode: p.away_code,
        kickoffAt: p.kickoff_at,
        status: p.match_status,
        actualHome: p.actual_home,
        actualAway: p.actual_away,
      },
      predictedHome: p.predicted_home,
      predictedAway: p.predicted_away,
      outcome: p.outcome,
      result: p.result,
      coinsDelta: p.coins_delta,
      settled: !!p.settled,
      createdAt: p.created_at,
    }));
  },

  // Settle every unsettled prediction for one finished match.
  // Atomic per match: balance, stats, ledger and prediction row move together.
  settleMatch(match) {
    const predictions = predictionRepo.listUnsettledForMatch(match.id);
    if (predictions.length === 0) {
      matchRepo.markSettled(match.id);
      return { settled: 0 };
    }

    const apply = db.transaction(() => {
      for (const p of predictions) {
        const { result, coinsDelta, correct, exact } = scorePrediction(
          p,
          match.home_score,
          match.away_score
        );
        predictionRepo.settle(p.id, { result, coinsDelta });
        const balanceAfter = userRepo.addBalance(p.user_id, coinsDelta);
        userRepo.incrementStats(p.user_id, { correct, exact });
        ledgerRepo.record({
          userId: p.user_id,
          amount: coinsDelta,
          reason: 'PREDICTION_SETTLED',
          refType: 'prediction',
          refId: p.id,
          balanceAfter,
        });
      }
      matchRepo.markSettled(match.id);
    });
    apply();

    logger.info(`Settled match ${match.id} (${match.home_team} vs ${match.away_team}): ${predictions.length} predictions.`);
    return { settled: predictions.length };
  },

  // Sweep all finished-but-unsettled matches. Called by the background job.
  settleFinishedMatches() {
    const matches = matchRepo.listSettleable();
    let total = 0;
    for (const m of matches) {
      total += this.settleMatch(m).settled;
    }
    return total;
  },
};
