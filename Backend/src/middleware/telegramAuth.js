import crypto from 'crypto';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';
import { userService } from '../services/userService.js';
import { logger } from '../utils/logger.js';

// Validate Telegram WebApp initData per the official algorithm:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// The frontend sends the raw initData string in the `Authorization` header as
// `tma <initData>`. We verify the HMAC signature, then load/create the user.

function verifyInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  // Build the data-check-string: sorted "key=value" lines joined by \n.
  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computed = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computed !== hash) return null;

  // Optional freshness check: reject initData older than 24h.
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (authDate) {
    const ageSec = Date.now() / 1000 - authDate;
    if (ageSec > 60 * 60 * 24) return null;
  }

  const userJson = params.get('user');
  if (!userJson) return null;
  return JSON.parse(userJson);
}

export function telegramAuth(req, res, next) {
  try {
    const header = req.get('Authorization') || '';
    const initData = header.startsWith('tma ') ? header.slice(4) : '';

    let tgUser;

    if (!config.telegram.requireSignature) {
      // DEV ONLY: accept an unsigned user passed as JSON in `X-Telegram-User`
      // or fall back to a fixed dev user so you can test in a plain browser.
      const devHeader = req.get('X-Telegram-User');
      tgUser = devHeader
        ? JSON.parse(devHeader)
        : { id: 999999, username: 'dev_user', first_name: 'Dev' };
      logger.debug('Auth signature check disabled - using dev user.');
    } else {
      if (!config.telegram.botToken) {
        throw ApiError.unauthorized('Server missing TELEGRAM_BOT_TOKEN');
      }
      if (!initData) throw ApiError.unauthorized('Missing Telegram initData');
      tgUser = verifyInitData(initData, config.telegram.botToken);
      if (!tgUser) throw ApiError.unauthorized('Invalid Telegram initData');
    }

    // Load or create the user and attach to the request.
    req.user = userService.upsertFromTelegram(tgUser);
    next();
  } catch (err) {
    next(err);
  }
}
