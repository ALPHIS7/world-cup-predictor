import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { predictionService } from '../services/predictionService.js';

export const predictionController = {
  // POST /api/predictions { matchId, home, away }
  create: asyncHandler(async (req, res) => {
    const { matchId, home, away } = req.body || {};
    if (matchId == null || home == null || away == null) {
      throw ApiError.badRequest('matchId, home and away are required');
    }
    const prediction = predictionService.create(
      req.user.id,
      Number(matchId),
      home,
      away
    );
    res.status(201).json({
      prediction: {
        id: prediction.id,
        matchId: prediction.match_id,
        home: prediction.predicted_home,
        away: prediction.predicted_away,
        outcome: prediction.outcome,
      },
    });
  }),

  // GET /api/predictions -> current user's prediction history
  listMine: asyncHandler(async (req, res) => {
    res.json({ predictions: predictionService.listForUser(req.user.id) });
  }),
};
