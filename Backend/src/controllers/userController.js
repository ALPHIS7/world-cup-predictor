import { asyncHandler } from '../utils/asyncHandler.js';
import { userService } from '../services/userService.js';

export const userController = {
  // POST /api/auth  -> returns profile (user already upserted by middleware)
  authenticate: asyncHandler(async (req, res) => {
    res.json({ user: userService.getProfile(req.user) });
  }),

  // GET /api/me  -> profile page data
  me: asyncHandler(async (req, res) => {
    res.json({ user: userService.getProfile(req.user) });
  }),

  // GET /api/me/dashboard -> home screen data
  dashboard: asyncHandler(async (req, res) => {
    res.json(userService.getDashboard(req.user));
  }),
};
