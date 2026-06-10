import { Router } from 'express';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { userController } from '../controllers/userController.js';
import { matchController } from '../controllers/matchController.js';
import { predictionController } from '../controllers/predictionController.js';
import { leaderboardController } from '../controllers/leaderboardController.js';

const router = Router();

// Health check (no auth) - handy for uptime monitors / deploy checks.
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Everything below requires a valid Telegram session.
router.use(telegramAuth);

// Auth / profile
router.post('/auth', userController.authenticate);
router.get('/me', userController.me);
router.get('/me/dashboard', userController.dashboard);

// Matches
router.get('/matches', matchController.list);
router.get('/matches/:id', matchController.getOne);
router.post('/matches/sync', matchController.sync);

// Predictions
router.post('/predictions', predictionController.create);
router.get('/predictions', predictionController.listMine);

// Leaderboard
router.get('/leaderboard', leaderboardController.top);

export default router;
