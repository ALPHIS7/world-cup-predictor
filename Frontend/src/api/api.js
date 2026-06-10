import { telegram, isTelegram } from '../telegram/telegram.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

// Build auth headers. In Telegram we send the signed initData; in a browser we
// send a dev user header (the backend accepts it only when signature checks are
// disabled via AUTH_REQUIRE_SIGNATURE=false).
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (isTelegram && telegram.initData) {
    headers['Authorization'] = `tma ${telegram.initData}`;
  } else {
    headers['X-Telegram-User'] = JSON.stringify({
      id: 999999,
      username: 'dev_user',
      first_name: 'Dev',
    });
  }
  return headers;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Typed-ish API surface. One function per backend endpoint.
export const api = {
  authenticate: () => request('/auth', { method: 'POST' }),
  getDashboard: () => request('/me/dashboard'),
  getProfile: () => request('/me'),
  getMatches: () => request('/matches'),
  getLeaderboard: () => request('/leaderboard'),
  getMyPredictions: () => request('/predictions'),
  createPrediction: (matchId, home, away) =>
    request('/predictions', { method: 'POST', body: { matchId, home, away } }),
};
