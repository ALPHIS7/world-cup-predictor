# ⚽ World Cup Predictor — Cloudflare Workers Backend

This is the **Cloudflare-native** backend: [Hono](https://hono.dev) on Workers
with a [D1](https://developers.cloudflare.com/d1/) (SQLite) database and a
**Cron Trigger** for settlement. It is a drop-in replacement for the Node/Express
backend (`../Backend`) and exposes the **same `/api` routes**, so the frontend
works against either one unchanged.

## Why a separate backend?

Cloudflare Workers run on V8 isolates, not Node.js. Three things from the Node
backend can't run there, and each has a Cloudflare equivalent:

| Node backend            | Workers replacement            |
|-------------------------|--------------------------------|
| `better-sqlite3` + file | **D1** (managed SQLite)        |
| `express`               | **Hono** router                |
| `setInterval` job       | **Cron Trigger** (`scheduled`) |
| Node `crypto` (HMAC)    | **Web Crypto** (`crypto.subtle`) |

The business logic (`services/`, `scoringService`) is identical in spirit — only
the data-access layer became async (D1 returns promises) and settlement now uses
an atomic **`db.batch([...])`** instead of a synchronous transaction.

---

## Prerequisites

- Node.js 18+ and a Cloudflare account (free tier is enough).
- Wrangler: installed as a dev dependency (`npx wrangler ...`) or globally.

```bash
cd BackendWorkers
npm install
npx wrangler login
```

---

## 1. Create the D1 database

```bash
npx wrangler d1 create worldcup
```

Copy the printed `database_id` into **`wrangler.toml`** (replace
`REPLACE_WITH_YOUR_D1_DATABASE_ID`).

## 2. Apply schema + seed

```bash
# Local (for `wrangler dev`)
npm run db:migrate:local
npm run db:seed:local      # optional demo data

# Remote (the deployed database)
npm run db:migrate:remote
npm run db:seed:remote     # optional
```

## 3. Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put FOOTBALL_API_KEY     # optional; omit to use mock fixtures
```

For local dev, copy `.dev.vars.example` → `.dev.vars` and fill it in. Setting
`AUTH_REQUIRE_SIGNATURE=false` there lets you test in a plain browser.

## 4. Run locally

```bash
npm run dev          # http://localhost:8787
# health check:
curl http://localhost:8787/api/health
```

## 5. Deploy

```bash
npm run deploy
```

Wrangler prints your Worker URL, e.g. `https://world-cup-predictor-api.<you>.workers.dev`.
Your API base for the frontend is that URL **+ `/api`**.

---

## Connect the frontend

In `../Frontend`, set the API base and rebuild:

```bash
# Frontend/.env
VITE_API_BASE=https://world-cup-predictor-api.<you>.workers.dev/api
```

Then deploy the frontend to **Cloudflare Pages**:

```bash
cd ../Frontend
npm install
npm run build           # outputs dist/
npx wrangler pages deploy dist --project-name world-cup-predictor
```

Finally:
- Put the Pages URL into **@BotFather** as the Mini App Web App URL.
- Set this Worker's `FRONTEND_URL` var (in `wrangler.toml`) to the Pages origin
  for CORS, then `npm run deploy` again.

---

## Settlement (Cron)

`wrangler.toml` schedules `*/2 * * * *` (every 2 minutes). On each tick the
`scheduled()` handler in `src/index.js`:

1. Syncs fixtures from the football API (or mock data),
2. Settles every finished-but-unsettled match in one atomic `db.batch`.

To trigger it manually while running `wrangler dev`:

```bash
curl "http://localhost:8787/__scheduled?cron=*/2+*+*+*+*"
```

---

## Project layout

```
BackendWorkers/
├── migrations/
│   ├── 0001_schema.sql        # D1 schema
│   └── 0002_seed.sql          # optional demo users + matches
├── src/
│   ├── config/                # config built from the env binding
│   ├── controllers/           # Hono handlers
│   ├── middleware/            # telegramAuth via Web Crypto
│   ├── repositories/          # D1 SQL (async)
│   ├── routes/                # Hono route table
│   ├── services/              # business logic (scoring, settlement, ...)
│   ├── utils/                 # ApiError
│   └── index.js               # fetch + scheduled handlers
├── wrangler.toml
└── package.json
```
