import { ApiError } from '../utils/ApiError.js';
import { userService } from '../services/userService.js';

// Telegram initData validation using the Web Crypto API (crypto.subtle), which
// is the only crypto available on Workers. Node's `crypto` module is not used.
//
// Algorithm (https://core.telegram.org/bots/webapps#validating-data-received):
//   secret_key = HMAC_SHA256("WebAppData", bot_token)
//   hash       = HMAC_SHA256(secret_key, data_check_string)

const enc = new TextEncoder();

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return new Uint8Array(sig);
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  // secret_key = HMAC("WebAppData", botToken)
  const secretKey = await hmacSha256(enc.encode('WebAppData'), botToken);
  const computed = toHex(await hmacSha256(secretKey, dataCheckString));
  if (computed !== hash) return null;

  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (authDate && Date.now() / 1000 - authDate > 60 * 60 * 24) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  return JSON.parse(userJson);
}

// Hono middleware. Attaches the resolved user to the context (c.set('user', ...)).
export function telegramAuth() {
  return async (c, next) => {
    const config = c.get('config');
    const db = c.get('db');

    const header = c.req.header('Authorization') || '';
    const initData = header.startsWith('tma ') ? header.slice(4) : '';

    let tgUser;
    if (!config.telegram.requireSignature) {
      const devHeader = c.req.header('X-Telegram-User');
      tgUser = devHeader
        ? JSON.parse(devHeader)
        : { id: 999999, username: 'dev_user', first_name: 'Dev' };
    } else {
      if (!config.telegram.botToken) throw ApiError.unauthorized('Server missing TELEGRAM_BOT_TOKEN');
      if (!initData) throw ApiError.unauthorized('Missing Telegram initData');
      tgUser = await verifyInitData(initData, config.telegram.botToken);
      if (!tgUser) throw ApiError.unauthorized('Invalid Telegram initData');
    }

    const user = await userService.upsertFromTelegram(db, tgUser);
    c.set('user', user);
    await next();
  };
}
