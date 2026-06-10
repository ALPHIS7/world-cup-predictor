// Tiny hash-free screen router. Screens are functions that render into a host
// element and return an optional cleanup function. Designed so adding a new
// screen (tournaments, shop, ...) is a one-line registration.
import { telegram } from '../telegram/telegram.js';

export class Router {
  constructor(host) {
    this.host = host;
    this.routes = new Map();
    this.current = null;
    this.cleanup = null;
    this.params = {};
  }

  register(name, renderFn) {
    this.routes.set(name, renderFn);
    return this;
  }

  // Navigate to a screen. `params` is passed to the render function.
  async navigate(name, params = {}) {
    const render = this.routes.get(name);
    if (!render) throw new Error(`Unknown route: ${name}`);

    // Tear down previous screen.
    if (this.cleanup) {
      try {
        this.cleanup();
      } catch {
        /* ignore */
      }
      this.cleanup = null;
    }
    telegram.mainButton.hide();
    telegram.backButton.hide();

    this.current = name;
    this.params = params;

    // Animate screen swap.
    this.host.classList.remove('screen-enter');
    // force reflow to restart the animation
    void this.host.offsetWidth;
    this.host.classList.add('screen-enter');

    const maybeCleanup = await render(this.host, params, this);
    this.cleanup = typeof maybeCleanup === 'function' ? maybeCleanup : null;
  }

  reload() {
    return this.navigate(this.current, this.params);
  }
}
