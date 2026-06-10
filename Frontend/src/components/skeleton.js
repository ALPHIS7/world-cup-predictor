import { el } from '../utils/dom.js';

// Shimmering placeholder rows shown while data loads.
export function skeletonList(count = 4) {
  const wrap = el('div', { class: 'skeleton-list' });
  for (let i = 0; i < count; i++) {
    wrap.appendChild(el('div', { class: 'skeleton-card shimmer' }));
  }
  return wrap;
}
