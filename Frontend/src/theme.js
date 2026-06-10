// Bridges Telegram theme params into CSS variables and toggles dark/light mode.
import { telegram } from './telegram/telegram.js';

function applyThemeParams(params) {
  const root = document.documentElement;
  // Map a few Telegram theme params onto our variables when present so the app
  // blends with the user's Telegram theme. Our own palette provides fallbacks.
  const map = {
    '--tg-bg': params.bg_color,
    '--tg-text': params.text_color,
    '--tg-hint': params.hint_color,
    '--tg-link': params.link_color,
    '--tg-button': params.button_color,
    '--tg-button-text': params.button_text_color,
    '--tg-secondary-bg': params.secondary_bg_color,
  };
  for (const [k, v] of Object.entries(map)) {
    if (v) root.style.setProperty(k, v);
  }
}

export function initTheme() {
  const root = document.documentElement;
  const setScheme = (scheme) => {
    root.setAttribute('data-theme', scheme === 'dark' ? 'dark' : 'light');
  };

  setScheme(telegram.colorScheme);
  applyThemeParams(telegram.themeParams);

  telegram.onThemeChange((scheme, params) => {
    setScheme(scheme);
    applyThemeParams(params);
  });
}
