import { asyncHandler } from '../utils/asyncHandler.js';
import { matchService } from '../services/matchService.js';

export const matchController = {
  // GET /api/matches -> today's relevant matches, annotated with user prediction
  list: asyncHandler(async (req, res) => {
    res.json({ matches: matchService.listForUser(req.user.id) });
  }),

  // GET /api/matches/:id
  getOne: asyncHandler(async (req, res) => {
    const match = matchService.getById(Number(req.params.id), req.user.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json({ match });
  }),

  // POST /api/matches/sync -> force a refresh from the football API (admin/dev)
  sync: asyncHandler(async (req, res) => {
    const count = await matchService.syncFromApi();
    res.json({ synced: count });
  }),
};
