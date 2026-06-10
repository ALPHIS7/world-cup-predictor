import { el } from '../utils/dom.js';
import { api } from '../api/api.js';
import { store } from '../store/store.js';
import { MatchCard } from '../components/matchCard.js';
import { skeletonList } from '../components/skeleton.js';
import { confetti } from '../components/effects.js';
import { telegram } from '../telegram/telegram.js';

// Group matches by status bucket for nicer sectioning.
function bucket(matches) {
  const live = matches.filter((m) => ['IN_PLAY', 'PAUSED'].includes(m.status));
  const upcoming = matches.filter((m) => ['TIMED', 'SCHEDULED'].includes(m.status));
  const finished = matches.filter((m) => m.status === 'FINISHED');
  return { live, upcoming, finished };
}

export async function MatchesScreen(host, _params, router) {
  host.innerHTML = '';
  host.appendChild(el('h2', { class: 'screen-title', text: '⚽ Predict' }));
  const listWrap = el('div', { class: 'match-list' }, [skeletonList(4)]);
  host.appendChild(listWrap);

  const onSubmit = async (matchId, home, away) => {
    await api.createPrediction(matchId, home, away);
    // No coins change at prediction time - payout happens when the match settles.
    telegram.notify('success');
    confetti(40);
    // Re-fetch so the card flips to "your pick" state.
    await load();
  };

  async function load() {
    try {
      const { matches } = await api.getMatches();
      store.set({ matches });
      renderList(matches);
    } catch (err) {
      listWrap.innerHTML = '';
      listWrap.appendChild(el('div', { class: 'card error-inline', text: err.message }));
    }
  }

  function section(title, items) {
    if (!items.length) return null;
    const wrap = el('div', { class: 'match-section' }, [
      el('h3', { class: 'section-title', text: title }),
    ]);
    items.forEach((m) => wrap.appendChild(MatchCard(m, onSubmit)));
    return wrap;
  }

  function renderList(matches) {
    listWrap.innerHTML = '';
    if (!matches.length) {
      listWrap.appendChild(el('div', { class: 'empty-state' }, [
        el('div', { class: 'empty-emoji', text: '🗓️' }),
        el('p', { text: 'No matches available right now. Check back soon!' }),
      ]));
      return;
    }
    const { live, upcoming, finished } = bucket(matches);
    [section('🔴 Live', live), section('⏰ Upcoming', upcoming), section('✅ Finished', finished)]
      .filter(Boolean)
      .forEach((s) => listWrap.appendChild(s));
  }

  await load();
}
