# ⚽ World Cup Predictor — Telegram Mini App

A playful, cartoon-styled Telegram Mini App where users predict World Cup match
scores and win or lose virtual coins based on accuracy. Built with vanilla
JavaScript + Vite on the frontend and Node.js + Express + SQLite on the backend.

> Scope of this version: **prediction game, coin system, profile, leaderboard.**
> The architecture is deliberately layered so tournaments, clans, a coin shop,
> daily rewards, missions, achievements, referrals and seasonal rankings can be
> added without rewrites (see [Extending](#-extending-future-features)).

> **Two backends, same API.** Pick one:
> - **`Backend/`** — Node.js + Express + SQLite. Best for a VPS / Render / Railway / Fly.io.
> - **`BackendWorkers/`** — Cloudflare Workers + Hono + D1, with a Cron Trigger for
>   settlement. Fully serverless on Cloudflare. See [`BackendWorkers/README.md`](./BackendWorkers/README.md).
>
> The frontend is identical for both — just point `VITE_API_BASE` at whichever you deploy.

---

## ✨ Features

- **Home** — avatar, username, coin balance, rank, daily match count.
- **Predict** — auto-loaded World Cup fixtures with flags, kickoff time and live
  status; pick a scoreline with +/- steppers (winner/draw is derived).
- **Coin system** — `+10` correct winner, `+25` exact score, `-5` wrong.
  Balance may go negative.
- **Automatic settlement** — a background job polls the football API, detects
  finished matches and pays out every prediction atomically.
- **Leaderboard** — global ranking by coins, with your own rank pinned.
- **Profile** — balance, totals, accuracy, exact-score count and full history.
- **Telegram native** — login via `initData`, Main/Back buttons, haptics,
  light/dark theme that follows the user's Telegram theme.
- **Animations** — coin gain/loss fly-ups, confetti on exact predictions,
  card/screen transitions, shimmer skeletons, bouncing mascot.

---

## 🗂 Project Structure

```
WorldCupPredictor/
├── Backend/                      # Node.js + Express API
│   ├── src/
│   │   ├── config/               # env-driven config + scoring rules
│   │   ├── controllers/          # thin HTTP handlers
│   │   ├── database/             # connection, migrate, seed, mock fixtures
│   │   ├── middleware/           # Telegram auth, error handler
│   │   ├── routes/               # route table
│   │   ├── services/             # business logic
│   │   │   └── repositories/     # all SQL lives here (data access layer)
│   │   ├── utils/                # logger, ApiError, asyncHandler
│   │   ├── app.js                # express app factory
│   │   └── server.js             # entry point + settlement job boot
│   ├── .env.example
│   └── package.json
│
├── Frontend/                     # Vite + vanilla JS Mini App
│   ├── src/
│   │   ├── api/                  # backend client
│   │   ├── components/           # navbar, match card, mascot, effects
│   │   ├── router/               # tiny screen router
│   │   ├── screens/              # home, matches, leaderboard, profile
│   │   ├── store/                # observable state store
│   │   ├── styles/               # variables, base, components, animations
│   │   ├── telegram/             # Telegram WebApp SDK wrapper
│   │   ├── utils/                # DOM helpers, flags, formatting
│   │   ├── theme.js              # Telegram theme → CSS variables
│   │   └── main.js               # bootstrap
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── Database/
    ├── schema.sql                # SQLite schema
    └── worldcup.db               # created on first migrate (gitignored)
```

---

## 🧱 Architecture

**Layered backend** keeps responsibilities separate and testable:

```
HTTP → routes → controllers → services → repositories → SQLite
                                  ↑
                       scoringService (pure, no DB)
```

- **Controllers** only parse/validate requests and shape responses.
- **Services** hold business logic (prediction rules, settlement, leaderboard).
- **Repositories** are the only place that touch SQL — swap SQLite for Postgres
  by reimplementing the repos, nothing else changes.
- **`scoringService`** is pure functions → trivially unit-testable.
- **Coin ledger** (`coin_transactions`) is append-only, so future features
  (shop, rewards, missions) record balance changes the same way.

**Frameworkless frontend** with a tiny router + observable store keeps the
bundle tiny and the Telegram integration explicit. Each screen is a function;
adding one is a single `router.register(...)` call.

---

## 🔌 API Reference

All routes are under `/api` and require Telegram auth except `/health`.
Auth header: `Authorization: tma <initData>` (the signed Telegram WebApp data).

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/health`             | Liveness check (no auth)                 |
| POST   | `/auth`               | Upsert user from Telegram, return profile|
| GET    | `/me`                 | Current user profile                     |
| GET    | `/me/dashboard`       | Home screen data (profile + daily stats) |
| GET    | `/matches`            | Relevant matches + your predictions      |
| GET    | `/matches/:id`        | Single match                             |
| POST   | `/matches/sync`       | Force fixture refresh from football API   |
| POST   | `/predictions`        | Create prediction `{matchId, home, away}`|
| GET    | `/predictions`        | Your prediction history                  |
| GET    | `/leaderboard`        | Global top players + your rank           |

**Scoring** (configurable in `Backend/src/config/index.js`):
`correctWinner: +10`, `exactScore: +25`, `wrong: -5`.

---

## 🚀 Getting Started (Local)

> Requires **Node.js 18+**. `better-sqlite3` builds a native addon, so on
> Windows you may need the
> [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

### 1. Backend

```bash
cd Backend
cp .env.example .env          # then edit values
npm install
npm run migrate               # creates Database/worldcup.db from schema.sql
npm run seed                  # optional: demo users + mock fixtures
npm run dev                   # http://localhost:3000
```

For **local browser testing without Telegram**, set in `.env`:

```
AUTH_REQUIRE_SIGNATURE=false
```

This makes the API trust a dev user so you can open the app in a normal browser.
**Never** set this to `false` in production.

### 2. Frontend

```bash
cd Frontend
cp .env.example .env          # VITE_API_BASE=http://localhost:3000/api
npm install
npm run dev                   # http://localhost:5173
```

### 3. Football data (optional)

Without a key, the backend serves **bundled mock fixtures** so everything works
offline. To use real data, get a free key at
[football-data.org](https://www.football-data.org/) and set in `Backend/.env`:

```
FOOTBALL_API_KEY=your_key
FOOTBALL_COMPETITION=WC
```

---

## 🤖 Telegram Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) → copy the token into
   `Backend/.env` as `TELEGRAM_BOT_TOKEN`.
2. Your Mini App must be served over **HTTPS**. For local dev, tunnel the Vite
   server:
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   # or: npx ngrok http 5173
   ```
3. In BotFather: `/newapp` → select your bot → set the **Web App URL** to your
   HTTPS tunnel (or production) URL.
4. Open the bot, tap the Mini App button. `initData` is signed by Telegram and
   verified server-side in `middleware/telegramAuth.js`.

---

## ☁️ Deployment

### Backend (Render / Railway / Fly.io / VPS)

- Set env vars from `.env.example` (`TELEGRAM_BOT_TOKEN`, `FRONTEND_URL`,
  `FOOTBALL_API_KEY`, `AUTH_REQUIRE_SIGNATURE=true`).
- Start command: `npm start`. Health check path: `/api/health`.
- SQLite needs a **persistent disk** (e.g. Render Disk, Fly volume) mounted
  where `DATABASE_PATH` points. For larger scale, migrate the repositories to
  Postgres.
- Run `npm run migrate` once on first deploy (or as a release command).

### Frontend (Vercel / Netlify / Cloudflare Pages / static host)

```bash
cd Frontend
npm run build          # outputs to dist/
```

- Deploy `dist/` as a static site.
- Set `VITE_API_BASE` at build time to your deployed backend, e.g.
  `https://your-api.onrender.com/api`.
- Put the deployed HTTPS URL into BotFather as the Web App URL.
- Set the backend's `FRONTEND_URL` to this origin for CORS.

---

## 🧩 Extending (Future Features)

The schema and layering already anticipate growth:

| Feature            | Where it slots in                                              |
|--------------------|----------------------------------------------------------------|
| Coin shop          | New `shop_items` table + `shopService`; debit via coin ledger. |
| Daily rewards      | `daily_rewards` table + service; credit via `ledgerRepo`.      |
| Missions / achievements | `missions`, `user_missions` tables; check on settlement event. |
| Friends / referrals| `friendships`, `referrals` tables; add to `userService`.       |
| Clans              | `clans`, `clan_members`; new screen + repo.                    |
| Tournaments        | `tournaments`, scope matches/leaderboards by tournament_id.    |
| Seasonal rankings  | Add `season_id` to a points table; reuse leaderboard service.  |

Add a feature by: (1) extend `schema.sql`, (2) add a repository, (3) add a
service, (4) expose a controller + route, (5) register a screen on the frontend
router. Existing layers stay untouched.

---

## 📝 Notes

- Predictions lock at kickoff and are unique per `(user, match)`.
- Settlement is idempotent: matches are marked `settled` and never double-paid.
- All coin movements are recorded in `coin_transactions` for auditability.
```
