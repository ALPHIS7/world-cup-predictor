import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { buildConfig } from './config/index.js';
import { apiRoutes } from './routes/routes.js';
import { matchService } from './services/matchService.js';
import { predictionService } from './services/predictionService.js';

const app = new Hono();

// Inject per-request config + D1 binding into the context.
app.use('*', async (c, next) => {
  c.set('config', buildConfig(c.env));
  c.set('db', c.env.DB);
  await next();
});

// CORS - allow the configured frontend origin (or any when "*").
app.use('*', async (c, next) => {
  const config = buildConfig(c.env);
  const origin = config.frontendUrl === '*' ? '*' : config.frontendUrl;
  return cors({ origin, allowHeaders: ['Content-Type', 'Authorization', 'X-Telegram-User'] })(c, next);
});

// Health check (no auth).
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

// Mount authenticated routes.
app.route('/api', apiRoutes);

// Central error handler -> JSON, mirroring the Node backend.
app.onError((err, c) => {
  const status = err.isApiError ? err.statusCode : 500;
  if (status >= 500) console.error('Unhandled error:', err);
  return c.json(
    { error: err.message || 'Internal Server Error', ...(err.details ? { details: err.details } : {}) },
    status
  );
});

app.notFound((c) => c.json({ error: 'Not found', path: c.req.path }, 404));

// Shared settlement routine used by the cron trigger.
async function runSettlement(env) {
  const config = buildConfig(env);
  const db = env.DB;
  await matchService.syncFromApi(db, config);
  const settled = await predictionService.settleFinishedMatches(db, config.scoring);
  if (settled > 0) console.log(`Cron settled ${settled} predictions.`);
  return settled;
}

export default {
  fetch: app.fetch,

  // Cron Trigger handler (replaces the Node setInterval loop).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runSettlement(env).catch((err) => console.error('Scheduled settlement failed:', err))
    );
  },
};
