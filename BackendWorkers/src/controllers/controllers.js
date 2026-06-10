import { ApiError } from '../utils/ApiError.js';
import { userService } from '../services/userService.js';
import { matchService } from '../services/matchService.js';
import { predictionService } from '../services/predictionService.js';
import { leaderboardService } from '../services/leaderboardService.js';

// Each handler pulls db/config/user from the Hono context set in index.js.
const ctx = (c) => ({ db: c.get('db'), config: c.get('config'), user: c.get('user') });

export const userController = {
  authenticate: async (c) => {
    const { db, user } = ctx(c);
    return c.json({ user: await userService.getProfile(db, user) });
  },
  me: async (c) => {
    const { db, user } = ctx(c);
    return c.json({ user: await userService.getProfile(db, user) });
  },
  dashboard: async (c) => {
    const { db, user } = ctx(c);
    return c.json(await userService.getDashboard(db, user));
  },
};

export const matchController = {
  list: async (c) => {
    const { db, user } = ctx(c);
    return c.json({ matches: await matchService.listForUser(db, user.id) });
  },
  sync: async (c) => {
    const { db, config } = ctx(c);
    return c.json({ synced: await matchService.syncFromApi(db, config) });
  },
};

export const predictionController = {
  create: async (c) => {
    const { db, user } = ctx(c);
    const body = await c.req.json().catch(() => ({}));
    const { matchId, home, away } = body;
    if (matchId == null || home == null || away == null) {
      throw ApiError.badRequest('matchId, home and away are required');
    }
    const p = await predictionService.create(db, user.id, Number(matchId), home, away);
    return c.json({
      prediction: {
        id: p.id, matchId: p.match_id,
        home: p.predicted_home, away: p.predicted_away, outcome: p.outcome,
      },
    }, 201);
  },
  listMine: async (c) => {
    const { db, user } = ctx(c);
    return c.json({ predictions: await predictionService.listForUser(db, user.id) });
  },
};

export const leaderboardController = {
  top: async (c) => {
    const { db, user } = ctx(c);
    const limit = Math.min(Number(c.req.query('limit')) || 50, 100);
    return c.json(await leaderboardService.getTop(db, user, limit));
  },
};
