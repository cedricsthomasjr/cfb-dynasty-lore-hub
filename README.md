# CFB Dynasty Lore Hub

An ESPN-quality media platform for a College Football 25 dynasty save. Upload
Xbox screenshots; the app detects the screen, parses the data with AI vision,
stores it in a normalized database, and generates polished, data-verified
content.

> **Core philosophy:** the database is the single source of truth. Vision
> extracts → database stores → frontend visualizes → AI presents. The AI never
> invents stats, scores, players, or events.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full roadmap, phase reasoning,
risk analysis, schema design, and folder architecture.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL · Prisma

## What's in Phase 1 (this build)

- ✅ Next.js App Router + TypeScript + Tailwind + shadcn/ui scaffolding
- ✅ Full Prisma schema for all dynasty entities (`prisma/schema.prisma`)
- ✅ Environment configuration (`.env.example`)
- ✅ App shell: sidebar + topbar navigation covering every planned page
- ✅ Upload endpoint — stores the file + an `Upload` row, hashed for idempotency
  (no parsing yet, by design)
- ✅ Dashboard skeleton: League Home + honest placeholder pages

Parsing, canonical promotion, historical aggregation, and the AI content engine
arrive in later phases — the seams for each already exist
(`src/lib/ingestion/`, staging tables, `NewsArticle.sourceData`).

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure the database
cp .env.example .env        # then edit DATABASE_URL if needed

# 3. Generate the Prisma client and create the schema
npx prisma generate
npx prisma migrate dev --name init   # requires a running PostgreSQL

# 4. Run the app
npm run dev                  # http://localhost:3000
```

> A PostgreSQL instance is required for the upload endpoint and any data page.
> The UI shell, navigation, and placeholder pages render without a database.

## Project layout

```
prisma/schema.prisma      Full normalized schema (all entities + staging)
src/app                   App Router pages + /api/upload route
src/components/ui         shadcn/ui primitives
src/components/layout     Sidebar, Topbar, AppShell
src/components/shared     PageHeader, PagePlaceholder
src/lib                   prisma client, storage driver, nav config, ingestion seams
```

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Generate Prisma client + build       |
| `npm run typecheck` | TypeScript check, no emit            |
| `npm run db:migrate`| Create/apply a migration             |
| `npm run db:studio` | Open Prisma Studio                   |
# cfb-dynasty-lore-hub
