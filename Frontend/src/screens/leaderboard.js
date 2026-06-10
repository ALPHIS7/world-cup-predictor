import { el } from '../utils/dom.js';
import { api } from '../api/api.js';
import { skeletonList } from '../components/skeleton.js';

function avatar(entry) {
  if (entry.photoUrl) return el('img', { class: 'lb-avatar', src: entry.photoUrl, alt: '' });
  const initials = (entry.firstName || entry.username || '?').slice(0, 1).toUpperCase();
  return el('div', { class: 'lb-avatar avatar-fallback', text: initials });
}

function medal(rank) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
}

function row(entry) {
  return el('div', { class: `lb-row ${entry.isCurrentUser ? 'lb-me' : ''} ${entry.rank <= 3 ? 'lb-top' : ''}` }, [
    el('div', { class: 'lb-rank', text: medal(entry.rank) }),
    avatar(entry),
    el('div', { class: 'lb-name' }, [
      el('div', { class: 'lb-username', text: entry.firstName || entry.username || 'Player' }),
      el('div', { class: 'lb-meta', text: `${entry.correctPredictions} correct` }),
    ]),
    el('div', { class: 'lb-score' }, [
      el('span', { text: String(entry.balance) }),
      el('span', { class: 'lb-coin', text: '🪙' }),
    ]),
  ]);
}

export async function LeaderboardScreen(host) {
  host.innerHTML = '';
  host.appendChild(el('h2', { class: 'screen-title', text: '🏆 Leaderboard' }));
  const listWrap = el('div', { class: 'lb-list' }, [skeletonList(6)]);
  host.appendChild(listWrap);

  try {
    const { entries, me } = await api.getLeaderboard();
    listWrap.innerHTML = '';

    if (!entries.length) {
      listWrap.appendChild(el('div', { class: 'empty-state' }, [
        el('div', { class: 'empty-emoji', text: '🏅' }),
        el('p', { text: 'No players ranked yet. Be the first!' }),
      ]));
      return;
    }

    entries.forEach((e) => listWrap.appendChild(row(e)));

    // Pin the current user's rank at the bottom if they're outside the top list.
    if (me && !entries.some((e) => e.isCurrentUser)) {
      host.appendChild(el('div', { class: 'lb-sticky-me' }, [row(me)]));
    }
  } catch (err) {
    listWrap.innerHTML = '';
    listWrap.appendChild(el('div', { class: 'card error-inline', text: err.message }));
  }
}
