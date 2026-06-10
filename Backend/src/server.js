import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { settlementJob } from './services/settlementJob.js';
import './database/db.js'; // open DB connection at boot

const app = createApp();

app.listen(config.port, () => {
  logger.info(`World Cup Predictor API listening on :${config.port} (${config.env})`);
  // Kick off fixture sync + settlement loop.
  settlementJob.start();
});

// Graceful shutdown.
process.on('SIGTERM', () => {
  settlementJob.stop();
  process.exit(0);
});
