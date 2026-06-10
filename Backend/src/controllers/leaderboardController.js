import { asyncHandler } from '../utils/asyncHandler.js';
import { leaderboardService } from '../services/leaderboardService.js';

export const leaderboardController = {
  // GET /api/leaderboard
  top: asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    res.json(leaderboardService.getTop(req.user, limit));
  }),
};
