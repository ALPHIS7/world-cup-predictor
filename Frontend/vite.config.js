import { defineConfig } from 'vite';

// Mobile-first Telegram Mini App. `base: './'` keeps asset paths relative so the
// build works under any hosting subpath. `host: true` exposes the dev server on
// the LAN so you can open it through an HTTPS tunnel (ngrok/cloudflared) inside
// Telegram during development.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
