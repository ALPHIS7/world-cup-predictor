import { el } from '../utils/dom.js';
import { api } from '../api/api.js';
import { store } from '../store/store.js';
import { Mascot } from '../components/mascot.js';
import { skeletonList } from '../components/skeleton.js';
import { telegram } from '../telegram/telegram.js';

// Avatar element: Telegram photo if available, else initials.
function avatar(user) {
  if (user?.photoUrl) {
    return el('img', { class: 'avatar', src: user.photoUrl, alt: 'avatar' });
  }
  const initials = (user?.firstName || user?.username || '?').slice(0, 1).toUpperCase();
  return el('div', { class: 'avatar avatar-fallback', text: initials });
}

function statTile(value, label, accent) {
  return el('div', { class: `stat-tile ${accent || ''}` }, [
    el('div', { class: 'stat-value', text: String(value) }),
    el('div', { class: 'stat-label', text: label }),
  ]);
}

export async function HomeScreen(host, _params, router) {
  const user = store.get().user;

  host.innerHTML = '';

  // Header: avatar, name, coin balance.
  const header = el('div', { class: 'home-header' }, [
    el('div', { class: 'home-user' }, [
      avatar(user),
      el('div', {}, [
        el('div', { class: 'home-hello', text: 'Welcome back' }),
        el('div', { class: 'home-name', text: user?.firstName || user?.username || 'Player' }),
      ]),
    ]),
    el('div', { class: 'coin-balance', id: 'home-balance' }, [
      el('span', { class: 'coin-icon', text: '🪙' }),
      el('span', { class: 'coin-amount', text: String(user?.balance ?? 0) }),
    ]),
  ]);

  // Hero with mascot + rank.
  const hero = el('div', { class: 'home-hero card gradient-card' }, [
    Mascot({ mood: 'cheer', size: 84 }),
    el('div', { class: 'hero-text' }, [
      el('div', { class: 'hero-title', text: 'Predict & Win!' }),
      el('div', { class: 'hero-sub', text: `Rank #${user?.rank ?? '—'} of ${user?.totalUsers ?? '—'}` }),
    ]),
  ]);

  // Stats row.
  const stats = el('div', { class: 'stat-grid' }, [
    statTile(user?.totalPredictions ?? 0, 'Predictions'),
    statTile(user?.correctPredictions ?? 0, 'Correct', 'accent-green'),
    statTile(`${user?.accuracy ?? 0}%`, 'Accuracy', 'accent-blue'),
  ]);

  // Daily section (filled after fetch).
  const dailyWrap = el('div', { class: 'home-daily' }, [skeletonList(1)]);

  const cta = el('button', { class: 'btn btn-primary btn-block cta-pulse',
    text: '⚽ Make Today\'s Predictions',
    onClick: () => { telegram.impact('medium'); router.navigate('matches'); } });

  host.appendChild(header);
  host.appendChild(hero);
  host.appendChild(stats);
  host.appendChild(el('h3', { class: 'section-title', text: 'Today' }));
  host.appendChild(dailyWrap);
  host.appendChild(cta);

  // Fetch fresh dashboard data.
  try {
    const data = await api.getDashboard();
    store.setUser(data.profile);
    dailyWrap.innerHTML = '';
    dailyWrap.appendChild(
      el('div', { class: 'card daily-card' }, [
        el('span', { class: 'daily-emoji', text: '📅' }),
        el('div', {}, [
          el('div', { class: 'daily-num', text: String(data.daily.matchesToday) }),
          el('div', { class: 'daily-label', text: 'matches scheduled today' }),
        ]),
      ])
    );
  } catch (err) {
    dailyWrap.innerHTML = '';
    dailyWrap.appendChild(el('div', { class: 'card', text: `Couldn't load: ${err.message}` }));
  }
}
