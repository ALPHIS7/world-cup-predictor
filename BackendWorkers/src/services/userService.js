import { userRepo } from '../repositories/userRepo.js';
import { matchRepo } from '../repositories/matchRepo.js';

export const userService = {
  async upsertFromTelegram(db, tgUser) {
    const payload = {
      telegram_id: tgUser.id,
      username: tgUser.username || null,
      first_name: tgUser.first_name || null,
      last_name: tgUser.last_name || null,
      photo_url: tgUser.photo_url || null,
      language_code: tgUser.language_code || null,
    };

    let user = await userRepo.findByTelegramId(db, tgUser.id);
    if (!user) user = await userRepo.create(db, payload);
    else user = await userRepo.updateProfile(db, user.id, payload);
    return user;
  },

  async getProfile(db, user) {
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
      rank: await userRepo.getRank(db, user.id),
      totalUsers: await userRepo.totalUsers(db),
      totalPredictions: user.total_predictions,
      correctPredictions: user.correct_predictions,
      exactPredictions: user.exact_predictions,
      accuracy,
    };
  },

  async getDashboard(db, user) {
    return {
      profile: await this.getProfile(db, user),
      daily: { matchesToday: await matchRepo.countToday(db) },
    };
  },
};
