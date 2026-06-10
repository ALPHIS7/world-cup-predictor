import { Hono } from 'hono';
import { telegramAuth } from '../middleware/telegramAuth.js';
import {
  userController, matchController, predictionController, leaderboardController,
} from '../controllers/controllers.js';

// Authenticated API routes. Mounted under /api in index.js.
export const apiRoutes = new Hono();

apiRoutes.use('*', telegramAuth());

apiRoutes.post('/auth', userController.authenticate);
apiRoutes.get('/me', userController.me);
apiRoutes.get('/me/dashboard', userController.dashboard);

apiRoutes.get('/matches', matchController.list);
apiRoutes.post('/matches/sync', matchController.sync);

apiRoutes.post('/predictions', predictionController.create);
apiRoutes.get('/predictions', predictionController.listMine);

apiRoutes.get('/leaderboard', leaderboardController.top);
