import { userRepo } from './repositories/userRepo.js';
import { matchRepo } from './repositories/matchRepo.js';

// Map a Telegram user payload to our internal user, creating on first login.
export const userService = {
  upsertFromTelegram(tgUser) {
    const payload = {
      telegram_id: tgUser.id,
      username: tgUser.username || null,
      first_name: tgUser.first_name || null,
      last_name: tgUser.last_name || null,
      photo_url: tgUser.photo_url || null,
      language_code: tgUser.language_code || null,
    };

    let user = userRepo.findByTelegramId(tgUser.id);
    if (!user) {
      user = userRepo.create(payload);
    } else {
      user = userRepo.updateProfile(user.id, payload);
    }
    return user;
  },

  // Public-facing profile with derived fields.
  getProfile(user) {
    const accuracy =
      user.total_predictions > 0
        ? Math.round((user.correct_predictions / user.total_predictions) * 100)
        : 0;

    return {
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      balance: user.balance,
      rank: userRepo.getRank(user.id),
      totalUsers: userRepo.totalUsers(),
      totalPredictions: user.total_predictions,
      correctPredictions: user.correct_predictions,
      exactPredictions: user.exact_predictions,
      accuracy,
    };
  },

  // Lightweight stats for the home screen header.
  getDashboard(user) {
    return {
      profile: this.getProfile(user),
      daily: {
        matchesToday: matchRepo.countToday(),
      },
    };
  },
};
