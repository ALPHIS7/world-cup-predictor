import { el } from '../utils/dom.js';

// Cute football mascot built from emoji + CSS. Cheap, themeable, no asset files.
// `mood`: 'happy' | 'sad' | 'cheer' changes the face and bounce.
export function Mascot({ mood = 'happy', size = 96 } = {}) {
  const faces = { happy: '⚽', sad: '⚽', cheer: '⚽' };
  return el('div', { class: `mascot mascot-${mood}`, style: `--mascot-size:${size}px` }, [
    el('div', { class: 'mascot-ball', text: faces[mood] || '⚽' }),
    el('div', { class: 'mascot-shadow' }),
  ]);
}
