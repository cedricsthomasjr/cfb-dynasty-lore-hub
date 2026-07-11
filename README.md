# 🏈 CFB Dynasty Lore Hub

An **ESPN-quality media platform for a College Football 25 dynasty save**. Upload
in-game screenshots (or type data in); the app reads them, a human approves the
result, and the site turns it into rankings, standings, team pages, rosters, box
scores — and, eventually, AI-written articles.

> **The one rule:** the database is the single source of truth, and **the AI
> never invents data.** Screenshots become *candidates* → a human approves them →
> only then are they saved as real data the site shows. Almost all of the code
> exists to enforce this.

## 📚 Documentation

Start with **[`docs/INDEX.md`](docs/INDEX.md)** — the documentation hub. Quick links:

| I want to… | Read |
|------------|------|
| Understand the project (no code) | [Concepts & Glossary](docs/CONCEPTS.md) |
| Run it locally | [Setup](docs/SETUP.md) |
| See the big picture / roadmap | [Architecture](ARCHITECTURE.md) |
| Follow how data moves | [Data Flow](docs/DATA-FLOW.md) |
| Understand the database | [Database Reference](docs/DATABASE.md) |
| Call or build endpoints | [API Reference](docs/API.md) |
| Build a feature | [Extending the App](docs/EXTENDING.md) |
| **Code by prompting an AI agent** | [Working with AI Agents](docs/WORKING-WITH-AGENTS.md) |

> 🤖 **Most work here happens by prompting coding agents.** If that's you, read
> [Working with AI Agents](docs/WORKING-WITH-AGENTS.md) first. Agents also
> auto-read [`AGENTS.md`](AGENTS.md).

## ⚡ Quickstart

```bash
npm install
cp .env.example .env            # set DATABASE_URL (needs PostgreSQL)
npx prisma migrate dev          # create the database schema
npm run db:seed                 # seed 134 FBS teams + a dev user
npm run dev                     # http://localhost:3000
```

Then create a dynasty and upload something — see the
[end-to-end example](docs/API.md#end-to-end-example). Full instructions and
troubleshooting: [Setup](docs/SETUP.md).

## 🧱 Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Prisma
· Zod · Claude vision (with an offline mock driver)

## 🗺️ How it works (30-second version)

```
Upload screenshot / JSON
   → AI reads it (or Zod validates typed input)     [ingestion]
   → candidates wait in staging tables
   → a human approves them in /review               [the trust gate]
   → approved data is written to the real tables    [promotion]
   → pages show only real, approved data
```

Details: [Data Flow](docs/DATA-FLOW.md) · why it's designed this way:
[Architecture](ARCHITECTURE.md).

## 📍 Where things live

```
cfb-dynasty-lore-hub/
├── README.md                    ← you are here
├── AGENTS.md                    ← brief coding agents auto-read
├── ARCHITECTURE.md              ← roadmap + design rationale
├── CONTRIBUTING.md              ← how to contribute (points to docs/EXTENDING.md)
├── docs/                        ← all documentation (start at INDEX.md)
├── prisma/
│   ├── schema.prisma            ← the database definition (source of truth)
│   ├── seed.mjs                 ← seeds FBS teams + dev user
│   └── seeds/team-catalog.json  ← the 134-team FBS list
└── src/
    ├── app/(dashboard)/         ← the pages
    ├── app/api/                 ← the API routes
    ├── components/              ← UI building blocks
    └── lib/
        ├── ingestion/           ← screenshots/manual → staging candidates
        ├── promotion/           ← approved candidates → real tables
        ├── dynasty/             ← create dynasties, pick your team
        ├── reads/               ← queries the pages use
        ├── auth/                ← "current user" (stubbed)
        ├── ai/                  ← vision provider (real Claude or mock)
        └── storage/             ← where uploaded files are saved
```

## 🚦 Project status

- **Phase 1** ✅ scaffold, schema, nav, upload endpoint.
- **Phase 2** ✅ detect → parse → stage → review queue.
- **Phase 2.5** ✅ team catalog, controlled teams, upload domains ([details](docs/UPLOAD_DOMAINS.md)).
- **Phase 3** ✅ canonical promotion + data-backed pages (rankings, CFP,
  standings, teams, players).
- **Next:** schedule/game center pages, stat rollups, AI content engine. See
  [Architecture](ARCHITECTURE.md).

## 🛠️ Common commands

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the dev server (hot reload) |
| `npm run build` | Production build (runs `prisma generate`) |
| `npm run typecheck` | TypeScript check — run before every commit |
| `npm run db:migrate` | Create/apply a database migration |
| `npm run db:seed` | Seed FBS teams + dev user (safe to re-run) |
| `npm run db:studio` | Open Prisma Studio (browse the database) |

Full list and env vars: [Setup](docs/SETUP.md).
