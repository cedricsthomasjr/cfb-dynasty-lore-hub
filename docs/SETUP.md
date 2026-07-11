# Setup

Get the app running locally from a clean checkout. Budget ~10 minutes.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 18.18+ or 20+ | `node -v` to check. [nodejs.org](https://nodejs.org) |
| **npm** | comes with Node | `npm -v` |
| **PostgreSQL** | 14+ | Local install, Docker, or a hosted DB (Neon/Supabase/Railway). |
| **Git** | any recent | |

> **No PostgreSQL?** The UI shell and placeholder pages render without a
> database, but uploads, dynasties, and every data page need one. Easiest paths:
> `brew install postgresql@16 && brew services start postgresql@16` (macOS), or
> `docker run --name cfb-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. Every variable is explained in [Environment variables](#environment-variables)
below. The only one you *must* get right is `DATABASE_URL`.

## 3. Create the database schema

```bash
npx prisma migrate dev      # creates tables from prisma/schema.prisma
```

This also generates the Prisma client (the typed database library the code uses).

## 4. Seed the starter data

```bash
npm run db:seed
```

Seeds two things:
- **`TeamCatalog`** — all 134 FBS teams (names, conferences, colors).
- **A dev user** (`dev@localhost`) — the stubbed "current user" the app acts as.

You should see `✓ Seeded 134 FBS teams` and `✓ Dev user ready`.

## 5. Run it

```bash
npm run dev                 # http://localhost:3000
```

Open <http://localhost:3000>. The nav on the left reaches every page. To see real
data, create a dynasty and upload something — see
[Workflows in the API docs](API.md#end-to-end-example) or the `/upload` page.

## Environment variables

All live in `.env` (copied from `.env.example`). Defaults are dev-friendly.

| Variable | Default | What it does |
|----------|---------|--------------|
| `DATABASE_URL` | `postgresql://…/cfb_lore_hub` | **Required.** Postgres connection string. |
| `STORAGE_DRIVER` | `local` | Where uploaded files go. Only `local` is implemented. |
| `STORAGE_LOCAL_DIR` | `./storage` | Folder for original uploaded bytes (gitignored). |
| `UPLOAD_PUBLIC_DIR` | `./public/uploads` | Folder for servable preview copies. |
| `MAX_UPLOAD_BYTES` | `10485760` (10 MB) | Reject uploads larger than this. |
| `VISION_DRIVER` | `mock` | `mock` = fake AI data, no key needed. `anthropic` = real Claude vision. Unset = auto (anthropic if a key is present, else mock). |
| `ANTHROPIC_API_KEY` | *(unset)* | Needed only when `VISION_DRIVER=anthropic`. |
| `VISION_MODEL` | `claude-opus-4-8` | Which Claude model reads screenshots. |
| `DEV_USER_ID` | *(unset)* | Force the stub "current user" to a specific user id. |
| `DEV_USER_EMAIL` | `dev@localhost` | Stub user's email (upserted if `DEV_USER_ID` unset). |
| `NEXT_PUBLIC_APP_NAME` | `Gridiron Lore` | App name shown in the UI. |

> **Tip:** keep `VISION_DRIVER=mock` while developing. It returns deterministic
> fixture data so the whole pipeline works offline and for free. Switch to
> `anthropic` only when you want to read a real screenshot.

## Everyday commands

```bash
npm run dev          # start the dev server (hot reload)
npm run build        # production build (also runs prisma generate)
npm run typecheck    # tsc --noEmit — run this before every commit
npm run lint         # Next.js lint

npm run db:migrate   # apply schema changes (prisma migrate dev)
npm run db:seed      # (re)seed catalog + dev user (safe to re-run)
npm run db:studio    # open Prisma Studio — a GUI to browse the database
npm run db:generate  # regenerate the Prisma client after schema edits
npm run db:push      # push schema without a migration (quick prototyping)
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Can't reach database server` | Postgres isn't running or `DATABASE_URL` is wrong. Start Postgres; confirm the DB named in the URL exists. |
| `The table … does not exist` | You skipped migrations. Run `npx prisma migrate dev`. |
| Pages say "No dynasty yet" | Expected on a fresh DB. Create one: `POST /api/dynasties` (see [API](API.md)). |
| `MockVisionProvider has no fixture for tool "…"` | You ran a parser the mock has no canned data for. Use `VISION_DRIVER=anthropic` with a real screenshot, or add a fixture in `src/lib/ai/mock-driver.ts`. |
| Uploads fail with "domain is required" | Every upload must specify a `domain` and `dynastyId`. See [API `/api/upload`](API.md#post-apiupload). |
| Port 3000 in use | Next picks the next free port (3001, 3002…). Check the terminal for the actual URL. |
| Prisma client out of date after editing schema | `npm run db:generate` (or just `npm run db:migrate`). |
