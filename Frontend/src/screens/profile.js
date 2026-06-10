import { el, flagEmoji } from '../utils/dom.js';
import { api } from '../api/api.js';
import { store } from '../store/store.js';
import { skeletonList } from '../components/skeleton.js';

function avatar(user) {
  if (user?.photoUrl) return el('img', { class: 'avatar avatar-lg', src: user.photoUrl, alt: '' });
  const initials = (user?.firstName || user?.username || '?').slice(0, 1).toUpperCase();
  return el('div', { class: 'avatar avatar-lg avatar-fallback', text: initials });
}

function statTile(value, label, accent) {
  return el('div', { class: `stat-tile ${accent || ''}` }, [
    el('div', { class: 'stat-value', text: String(value) }),
    el('div', { class: 'stat-label', text: label }),
  ]);
}

// One history row for a past prediction.
function historyRow(p) {
  const m = p.match;
  const resultClass = {
    CORRECT_EXACT: 'h-exact', CORRECT_WINNER: 'h-correct', WRONG: 'h-wrong',
  }[p.result] || 'h-pending';
  const delta = p.settled ? `${p.coinsDelta > 0 ? '+' : ''}${p.coinsDelta} 🪙` : 'pending';
  const actual = m.actualHome != null ? `${m.actualHome}–${m.actualAway}` : '—';
  return el('div', { class: `history-row ${resultClass}` }, [
    el('div', { class: 'h-teams' }, [
      el('span', { text: `${flagEmoji(m.homeCode)} ${m.homeTeam}` }),
      el('span', { class: 'h-vs', text: 'vs' }),
      el('span', { text: `${m.awayTeam} ${flagEmoji(m.awayCode)}` }),
    ]),
    el('div', { class: 'h-detail' }, [
      el('span', { class: 'h-pick', text: `Pick ${p.predictedHome}–${p.predictedAway}` }),
      el('span', { class: 'h-actual', text: `Result ${actual}` }),
      el('span', { class: 'h-delta', text: delta }),
    ]),
  ]);
}

export async function ProfileScreen(host) {
  host.innerHTML = '';
  const user = store.get().user;

  const head = el('div', { class: 'profile-head card gradient-card' }, [
    avatar(user),
    el('div', { class: 'profile-id' }, [
      el('div', { class: 'profile-name', text: user?.firstName || user?.username || 'Player' }),
      user?.username ? el('div', { class: 'profile-handle', text: `@${user.username}` }) : null,
      el('div', { class: 'profile-rank', text: `🏆 Rank #${user?.rank ?? '—'}` }),
    ]),
  ]);

  const balance = el('div', { class: 'profile-balance card' }, [
    el('span', { class: 'coin-icon-lg', text: '🪙' }),
    el('div', {}, [
      el('div', { class: 'pb-amount', text: String(user?.balance ?? 0) }),
      el('div', { class: 'pb-label', text: 'coin balance' }),
    ]),
  ]);

  const stats = el('div', { class: 'stat-grid stat-grid-2' }, [
    statTile(user?.totalPredictions ?? 0, 'Total predictions'),
    statTile(user?.correctPredictions ?? 0, 'Correct', 'accent-green'),
    statTile(user?.exactPredictions ?? 0, 'Exact scores', 'accent-gold'),
    statTile(`${user?.accuracy ?? 0}%`, 'Accuracy', 'accent-blue'),
  ]);

  host.appendChild(head);
  host.appendChild(balance);
  host.appendChild(stats);
  host.appendChild(el('h3', { class: 'section-title', text: 'Prediction history' }));
  const histWrap = el('div', { class: 'history-list' }, [skeletonList(3)]);
  host.appendChild(histWrap);

  // Refresh profile + load history.
  try {
    const [{ user: fresh }, { predictions }] = await Promise.all([
      api.getProfile(),
      api.getMyPredictions(),
    ]);
    store.setUser(fresh);

    histWrap.innerHTML = '';
    if (!predictions.length) {
      histWrap.appendChild(el('div', { class: 'empty-state' }, [
        el('div', { class: 'empty-emoji', text: '🎯' }),
        el('p', { text: 'No predictions yet. Head to the Predict tab!' }),
      ]));
    } else {
      predictions.forEach((p) => histWrap.appendChild(historyRow(p)));
    }
  } catch (err) {
    histWrap.innerHTML = '';
    histWrap.appendChild(el('div', { class: 'card error-inline', text: err.message }));
  }
}
