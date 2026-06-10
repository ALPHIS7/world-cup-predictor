import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../../');

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    // When false, the server trusts unsigned initData (browser dev only).
    requireSignature: (process.env.AUTH_REQUIRE_SIGNATURE || 'true') !== 'false',
  },

  football: {
    apiKey: process.env.FOOTBALL_API_KEY || '',
    base: process.env.FOOTBALL_API_BASE || 'https://api.football-data.org/v4',
    competition: process.env.FOOTBALL_COMPETITION || 'WC',
  },

  settleIntervalMs: parseInt(process.env.SETTLE_INTERVAL_MS || '120000', 10),

  database: {
    path: path.resolve(
      backendRoot,
      process.env.DATABASE_PATH || '../Database/worldcup.db'
    ),
  },

  // Coin scoring rules - centralized so future features can reuse them.
  scoring: {
    correctWinner: 10,
    exactScore: 25,
    wrong: -5,
  },
};

export const isProd = config.env === 'production';
