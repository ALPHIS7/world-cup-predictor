import { el, flagEmoji, formatKickoff } from '../utils/dom.js';
import { telegram } from '../telegram/telegram.js';

// Status pill text + class per match status.
function statusPill(match) {
  if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
    return el('span', { class: 'pill pill-live', html: '<i class="live-dot"></i> LIVE' });
  }
  if (match.status === 'FINISHED') {
    return el('span', { class: 'pill pill-finished', text: 'FT' });
  }
  return el('span', { class: 'pill pill-timed', text: formatKickoff(match.kickoffAt) });
}

// Render the read-only result line for a settled/finished match.
function resultLine(match) {
  if (match.homeScore == null) return null;
  return el('div', { class: 'match-result', text: `${match.homeScore} – ${match.awayScore}` });
}

// Badge showing how the user's prediction turned out.
function predictionBadge(pred) {
  if (!pred) return null;
  if (!pred.settled) {
    return el('div', { class: 'pred-badge pred-pending',
      text: `Your pick: ${pred.home}–${pred.away}` });
  }
  const map = {
    CORRECT_EXACT: ['pred-exact', `Exact! +${pred.coinsDelta} 🪙`],
    CORRECT_WINNER: ['pred-correct', `Winner +${pred.coinsDelta} 🪙`],
    WRONG: ['pred-wrong', `Missed ${pred.coinsDelta} 🪙`],
  };
  const [cls, label] = map[pred.result] || ['pred-pending', ''];
  return el('div', { class: `pred-badge ${cls}`, text: `${pred.home}–${pred.away} · ${label}` });
}

// A team column: flag (real crest image if available, else emoji), name, and
// (when predicting) a score stepper.
function teamColumn(name, code, crest, side, stepperState) {
  const flag = crest
    ? el('img', {
        class: 'team-crest',
        src: crest,
        alt: name,
        loading: 'lazy',
        // If the crest fails to load, fall back to an emoji flag.
        onError: (e) => {
          const span = el('div', { class: 'team-flag', text: flagEmoji(code) });
          e.target.replaceWith(span);
        },
      })
    : el('div', { class: 'team-flag', text: flagEmoji(code) });

  const children = [flag, el('div', { class: 'team-name', text: name })];
  if (stepperState) {
    children.push(scoreStepper(side, stepperState));
  }
  return el('div', { class: 'team-col' }, children);
}

// +/- score stepper bound to shared state object {home, away}.
function scoreStepper(side, state) {
  const value = el('div', { class: 'stepper-value', text: String(state[side]) });
  const dec = el('button', { class: 'stepper-btn', text: '−', onClick: () => {
    state[side] = Math.max(0, state[side] - 1);
    value.textContent = String(state[side]);
    telegram.select();
    state.onChange?.();
  }});
  const inc = el('button', { class: 'stepper-btn', text: '+', onClick: () => {
    state[side] = Math.min(20, state[side] + 1);
    value.textContent = String(state[side]);
    telegram.select();
    state.onChange?.();
  }});
  return el('div', { class: 'stepper' }, [dec, value, inc]);
}

// Outcome chips: Home / Draw / Away derived from current score.
function outcomeChips(state) {
  const chips = el('div', { class: 'outcome-chips' });
  const render = () => {
    const oc = state.home > state.away ? 'HOME' : state.home < state.away ? 'AWAY' : 'DRAW';
    chips.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('chip-active', c.dataset.oc === oc);
    });
  };
  ['HOME', 'DRAW', 'AWAY'].forEach((oc) => {
    chips.appendChild(el('span', { class: 'chip', 'data-oc': oc,
      text: oc === 'HOME' ? 'Home win' : oc === 'DRAW' ? 'Draw' : 'Away win' }));
  });
  state._renderChips = render;
  return chips;
}

/**
 * Render a match card.
 * @param {object} match - presented match from the API
 * @param {function} onSubmit - (matchId, home, away) => Promise, called on confirm
 */
export function MatchCard(match, onSubmit) {
  const canPredict = !match.locked && !match.prediction;

  const card = el('div', { class: 'match-card card' });

  const header = el('div', { class: 'match-header' }, [
    el('span', { class: 'match-stage', text: (match.stage || 'WORLD CUP').replace(/_/g, ' ') }),
    statusPill(match),
  ]);

  const state = canPredict ? { home: 0, away: 0 } : null;

  const body = el('div', { class: 'match-body' }, [
    teamColumn(match.homeTeam, match.homeCode, match.homeCrest, 'home', state),
    el('div', { class: 'match-vs' }, [
      resultLine(match) || el('span', { class: 'vs-text', text: 'VS' }),
    ]),
    teamColumn(match.awayTeam, match.awayCode, match.awayCrest, 'away', state),
  ]);

  card.appendChild(header);
  card.appendChild(body);

  // Existing prediction or result badge.
  const badge = predictionBadge(match.prediction);
  if (badge) card.appendChild(badge);

  // Prediction controls.
  if (canPredict) {
    const chips = outcomeChips(state);
    state.onChange = () => state._renderChips();
    state._renderChips();
    card.appendChild(chips);

    const confirm = el('button', { class: 'btn btn-primary confirm-btn',
      text: 'Confirm prediction',
      onClick: async () => {
        confirm.disabled = true;
        confirm.classList.add('loading');
        telegram.impact('medium');
        try {
          await onSubmit(match.id, state.home, state.away);
        } catch (err) {
          confirm.disabled = false;
          confirm.classList.remove('loading');
          telegram.showAlert(err.message);
        }
      }});
    card.appendChild(confirm);
  } else if (match.locked && !match.prediction && match.status !== 'FINISHED') {
    card.appendChild(el('div', { class: 'match-locked', text: '🔒 Predictions closed' }));
  }

  return card;
}
