// Thin wrapper around the Telegram WebApp runtime (window.Telegram.WebApp).
// Falls back to a harmless mock when opened in a plain browser so the app
// still runs during development.

const tg = window.Telegram?.WebApp;

const noop = () => {};
const mockHaptic = { impactOccurred: noop, notificationOccurred: noop, selectionChanged: noop };

export const isTelegram = !!tg && !!tg.initData;

export const telegram = {
  raw: tg,

  // Raw initData string sent to the backend for verification.
  initData: tg?.initData || '',

  // Parsed Telegram user (may be undefined in a browser).
  user: tg?.initDataUnsafe?.user || null,

  // Telegram theme: 'light' | 'dark'
  colorScheme: tg?.colorScheme || 'light',

  themeParams: tg?.themeParams || {},

  init() {
    if (!tg) return;
    tg.ready();
    tg.expand();
    // Keep the Mini App from closing on accidental swipe-down (Telegram 7.7+).
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor?.('secondary_bg_color');
  },

  onThemeChange(cb) {
    if (!tg) return;
    tg.onEvent('themeChanged', () => cb(tg.colorScheme, tg.themeParams));
  },

  // ---- Main Button ----
  mainButton: {
    show(text, onClick) {
      if (!tg) return;
      const mb = tg.MainButton;
      mb.setText(text);
      mb.offClick(this._handler || noop);
      this._handler = onClick;
      mb.onClick(onClick);
      mb.enable();
      mb.show();
    },
    setText(text) {
      tg?.MainButton.setText(text);
    },
    showProgress() {
      tg?.MainButton.showProgress();
    },
    hideProgress() {
      tg?.MainButton.hideProgress();
    },
    enable() {
      tg?.MainButton.enable();
    },
    disable() {
      tg?.MainButton.disable();
    },
    hide() {
      if (!tg) return;
      tg.MainButton.offClick(this._handler || noop);
      tg.MainButton.hide();
    },
    _handler: null,
  },

  // ---- Back Button ----
  backButton: {
    show(onClick) {
      if (!tg) return;
      const bb = tg.BackButton;
      bb.offClick(this._handler || noop);
      this._handler = onClick;
      bb.onClick(onClick);
      bb.show();
    },
    hide() {
      if (!tg) return;
      tg.BackButton.offClick(this._handler || noop);
      tg.BackButton.hide();
    },
    _handler: null,
  },

  // ---- Haptics ----
  haptic: tg?.HapticFeedback || mockHaptic,

  impact(style = 'medium') {
    this.haptic.impactOccurred?.(style);
  },
  notify(type = 'success') {
    this.haptic.notificationOccurred?.(type);
  },
  select() {
    this.haptic.selectionChanged?.();
  },

  showAlert(msg) {
    if (tg?.showAlert) tg.showAlert(msg);
    else alert(msg);
  },
};
