import { userRepo } from '../repositories/userRepo.js';

export const leaderboardService = {
  async getTop(db, currentUser, limit = 50) {
    const rows = await userRepo.leaderboard(db, limit, 0);
    const entries = rows.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      telegramId: u.telegram_id,
      username: u.username,
      firstName: u.first_name,
      photoUrl: u.photo_url,
      balance: u.balance,
      correctPredictions: u.correct_predictions,
      isCurrentUser: currentUser ? u.id === currentUser.id : false,
    }));

    let me = null;
    if (currentUser) {
      const fresh = await userRepo.findById(db, currentUser.id);
      me = {
        rank: await userRepo.getRank(db, currentUser.id),
        userId: fresh.id,
        username: fresh.username,
        firstName: fresh.first_name,
        photoUrl: fresh.photo_url,
        balance: fresh.balance,
        correctPredictions: fresh.correct_predictions,
        isCurrentUser: true,
      };
    }

    return { entries, me, totalUsers: await userRepo.totalUsers(db) };
  },
};
