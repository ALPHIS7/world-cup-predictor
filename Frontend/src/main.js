import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

import { telegram } from './telegram/telegram.js';
import { initTheme } from './theme.js';
import { Router } from './router/router.js';
import { store } from './store/store.js';
import { api } from './api/api.js';

import { renderNavbar } from './components/navbar.js';
import { HomeScreen } from './screens/home.js';
import { MatchesScreen } from './screens/matches.js';
import { LeaderboardScreen } from './screens/leaderboard.js';
import { ProfileScreen } from './screens/profile.js';

async function boot() {
  telegram.init();
  initTheme();

  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="screen" class="screen"></div>
    <nav id="navbar" class="navbar"></nav>
  `;

  const screenHost = document.getElementById('screen');
  const navHost = document.getElementById('navbar');

  const router = new Router(screenHost);
  router
    .register('home', HomeScreen)
    .register('matches', MatchesScreen)
    .register('leaderboard', LeaderboardScreen)
    .register('profile', ProfileScreen);

  // Authenticate (creates the user on first launch) before first render.
  try {
    const { user } = await api.authenticate();
    store.setUser(user);
  } catch (err) {
    screenHost.innerHTML = `
      <div class="error-state">
        <div class="error-emoji">📡</div>
        <h2>Can't reach the server</h2>
        <p>${err.message}</p>
        <p class="hint">Is the backend running on the configured VITE_API_BASE?</p>
      </div>`;
    return;
  }

  // Render persistent navbar and wire navigation.
  renderNavbar(navHost, router);

  await router.navigate('home');

  // Expose for debugging in dev.
  window.__wcp = { router, store, telegram };
}

boot();
