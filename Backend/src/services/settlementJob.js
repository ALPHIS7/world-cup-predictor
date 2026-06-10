import { config } from '../config/index.js';
import { matchService } from './matchService.js';
import { predictionService } from './predictionService.js';
import { logger } from '../utils/logger.js';

// Periodically: refresh fixtures from the API, then settle finished matches.
let timer = null;

async function tick() {
  try {
    await matchService.syncFromApi();
    const settled = predictionService.settleFinishedMatches();
    if (settled > 0) logger.info(`Settlement job paid out ${settled} predictions.`);
  } catch (err) {
    logger.error('Settlement job tick failed:', err);
  }
}

export const settlementJob = {
  start() {
    // Run once at boot, then on an interval.
    tick();
    timer = setInterval(tick, config.settleIntervalMs);
    logger.info(`Settlement job started (every ${config.settleIntervalMs}ms).`);
  },
  stop() {
    if (timer) clearInterval(timer);
  },
  runOnce: tick,
};
