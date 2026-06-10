import { el } from '../utils/dom.js';
import { telegram } from '../telegram/telegram.js';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'matches', label: 'Predict', icon: '⚽' },
  { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

// Bottom tab bar. Highlights the active route and emits navigation.
export function renderNavbar(host, router) {
  const buttons = new Map();

  const setActive = (name) => {
    buttons.forEach((btn, id) => btn.classList.toggle('active', id === name));
  };

  TABS.forEach((tab) => {
    const btn = el('button', {
      class: 'navbar-btn',
      onClick: () => {
        if (router.current === tab.id) return;
        telegram.select();
        router.navigate(tab.id).then(() => setActive(tab.id));
      },
    }, [
      el('span', { class: 'navbar-icon', text: tab.icon }),
      el('span', { class: 'navbar-label', text: tab.label }),
    ]);
    buttons.set(tab.id, btn);
    host.appendChild(btn);
  });

  // Keep the active tab in sync when navigation happens elsewhere.
  const origNavigate = router.navigate.bind(router);
  router.navigate = async (name, params) => {
    const r = await origNavigate(name, params);
    setActive(name);
    return r;
  };

  setActive(router.current || 'home');
}
