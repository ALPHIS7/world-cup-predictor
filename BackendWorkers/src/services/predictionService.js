import { matchRepo } from '../repositories/matchRepo.js';
import { predictionRepo } from '../repositories/predictionRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import { ledgerRepo } from '../repositories/ledgerRepo.js';
import { outcomeOf, scorePrediction } from './scoringService.js';
import { isLocked } from './matchService.js';
import { ApiError } from '../utils/ApiError.js';

export const predictionService = {
  // Create a prediction. Enforces match exists, not locked, no duplicate, valid scores.
  async create(db, userId, matchId, predictedHome, predictedAway) {
    const match = await matchRepo.findById(db, matchId);
    if (!match) throw ApiError.notFound('Match not found');
    if (isLocked(match)) {
      throw ApiError.forbidden('Match already started - predictions are locked');
    }

    const h = Number(predictedHome);
    const a = Number(predictedAway);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0 || h > 30 || a > 30) {
      throw ApiError.badRequest('Scores must be integers between 0 and 30');
    }

    const existing = await predictionRepo.findByUserAndMatch(db, userId, matchId);
    if (existing) throw ApiError.conflict('You already predicted this match');

    const outcome = outcomeOf(h, a);
    try {
      return await predictionRepo.create(db, {
        user_id: userId, match_id: matchId,
        predicted_home: h, predicted_away: a, outcome,
      });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        throw ApiError.conflict('You already predicted this match');
      }
      throw err;
    }
  },

  async listForUser(db, userId, limit = 50) {
    const rows = await predictionRepo.listByUser(db, userId, limit);
    return rows.map((p) => ({
      id: p.id,
      match: {
        homeTeam: p.home_team, awayTeam: p.away_team,
        homeCode: p.home_code, awayCode: p.away_code,
        kickoffAt: p.kickoff_at, status: p.match_status,
        actualHome: p.actual_home, actualAway: p.actual_away,
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

  // Settle one finished match. D1 has no interactive transactions, so we
  // compute balances in memory then commit everything in a single atomic batch.
  async settleMatch(db, match, scoring) {
    const predictions = await predictionRepo.listUnsettledForMatch(db, match.id);
    if (predictions.length === 0) {
      await matchRepo.markSettledStmt(db, match.id).run();
      return 0;
    }

    // Current balances for everyone involved (so balance_after is accurate even
    // if one user has multiple predictions - not possible today, but safe).
    const balances = new Map();
    const stmts = [];

    for (const p of predictions) {
      const { result, coinsDelta, correct, exact } = scorePrediction(
        p, match.home_score, match.away_score, scoring
      );

      if (!balances.has(p.user_id)) {
        const u = await userRepo.findById(db, p.user_id);
        balances.set(p.user_id, u.balance);
      }
      const balanceAfter = balances.get(p.user_id) + coinsDelta;
      balances.set(p.user_id, balanceAfter);

      stmts.push(predictionRepo.settleStmt(db, p.id, { result, coinsDelta }));
      stmts.push(userRepo.addBalanceStmt(db, p.user_id, coinsDelta));
      stmts.push(userRepo.incrementStatsStmt(db, p.user_id, { correct, exact }));
      stmts.push(
        ledgerRepo.recordStmt(db, {
          userId: p.user_id, amount: coinsDelta, reason: 'PREDICTION_SETTLED',
          refType: 'prediction', refId: p.id, balanceAfter,
        })
      );
    }
    stmts.push(matchRepo.markSettledStmt(db, match.id));

    await db.batch(stmts);
    return predictions.length;
  },

  // Sweep all finished-but-unsettled matches. Called by the cron handler.
  async settleFinishedMatches(db, scoring) {
    const matches = await matchRepo.listSettleable(db);
    let total = 0;
    for (const m of matches) total += await this.settleMatch(db, m, scoring);
    return total;
  },
};
