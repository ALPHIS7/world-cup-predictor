import { el } from '../utils/dom.js';
import { telegram } from '../telegram/telegram.js';

// Floating "+N / -N coins" animation near the screen center.
export function flyCoins(amount) {
  const positive = amount >= 0;
  const layer = el('div', {
    class: `coin-fly ${positive ? 'coin-fly-up' : 'coin-fly-down'}`,
    text: `${positive ? '+' : ''}${amount} 🪙`,
  });
  document.body.appendChild(layer);
  telegram.notify(positive ? 'success' : 'error');
  setTimeout(() => layer.remove(), 1500);
}

// Confetti burst - used for exact-score predictions. Pure DOM, no library.
export function confetti(count = 90) {
  const layer = el('div', { class: 'confetti-layer' });
  const colors = ['#ff5a5f', '#ffb400', '#2ec4b6', '#3a86ff', '#8338ec', '#06d6a0'];
  for (let i = 0; i < count; i++) {
    const piece = el('i', { class: 'confetti-piece' });
    const c = colors[i % colors.length];
    piece.style.setProperty('--c', c);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 240}px`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--d', `${0.9 + Math.random() * 0.8}s`);
    piece.style.setProperty('--delay', `${Math.random() * 0.2}s`);
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  telegram.notify('success');
  setTimeout(() => layer.remove(), 2200);
}

// Pulse a coin balance element to draw the eye when it changes.
export function pulse(node) {
  if (!node) return;
  node.classList.remove('pulse');
  void node.offsetWidth;
  node.classList.add('pulse');
}
