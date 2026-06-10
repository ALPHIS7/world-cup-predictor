// Minimal observable store - no framework. Screens subscribe and re-render.
const state = {
  user: null,        // profile object from /auth or /me
  matches: [],
  leaderboard: null,
  loading: false,
};

const listeners = new Set();

export const store = {
  get() {
    return state;
  },

  set(patch) {
    Object.assign(state, patch);
    listeners.forEach((fn) => fn(state));
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Convenience: update just the balance + stats after a prediction settles
  // or when fresh profile data arrives.
  setUser(user) {
    this.set({ user });
  },
};
