// Tiny structured logger. Swap for pino/winston later without touching call sites.
const ts = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[${ts()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${ts()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${ts()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${ts()}] [DEBUG]`, ...args);
    }
  },
};
