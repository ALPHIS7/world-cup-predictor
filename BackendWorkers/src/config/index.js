// On Workers there is no process.env at module load - config is derived from the
// `env` binding passed to fetch()/scheduled() at request time.
export function buildConfig(env) {
  return {
    frontendUrl: env.FRONTEND_URL || '*',

    telegram: {
      botToken: env.TELEGRAM_BOT_TOKEN || '',
      requireSignature: (env.AUTH_REQUIRE_SIGNATURE || 'true') !== 'false',
    },

    football: {
      apiKey: env.FOOTBALL_API_KEY || '',
      base: env.FOOTBALL_API_BASE || 'https://api.football-data.org/v4',
      competition: env.FOOTBALL_COMPETITION || 'WC',
    },

    // Coin scoring rules - centralized so future features can reuse them.
    scoring: {
      correctWinner: 10,
      exactScore: 25,
      wrong: -5,
    },
  };
}
