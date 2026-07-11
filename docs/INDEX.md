# Documentation Index

Everything you need to understand, run, and extend the **CFB Dynasty Lore Hub**.
If you're new, read in the order below. If you're using a coding agent (Cursor,
Claude Code, etc.), point it at the file that matches your task and skim
[Working with AI Agents](WORKING-WITH-AGENTS.md) first.

## The one rule that explains everything

> **The database is the single source of truth. The AI never invents data.**
> Screenshots and manual entry become *candidates* → a human approves them →
> only then are they written to the "real" tables the site reads from.

If you remember nothing else, remember that. Most of the code exists to enforce
it. See [Concepts](CONCEPTS.md) for the plain-English version.

## Read in this order

| # | Doc | What it covers | Read if you… |
|---|-----|----------------|--------------|
| 1 | [Concepts & Glossary](CONCEPTS.md) | Plain-language mental model + every term defined | …are new to the project |
| 2 | [Setup](SETUP.md) | Install, database, env vars, seed, run, troubleshoot | …need it running locally |
| 3 | [Architecture](../ARCHITECTURE.md) | The 7-phase roadmap, design decisions, folder map | …want the big picture |
| 4 | [Data Flow](DATA-FLOW.md) | Upload → parse → review → promote → pages, step by step | …want to see how data moves |
| 5 | [Database](DATABASE.md) | Every table, column, enum, and relationship | …are touching data / Prisma |
| 6 | [API Reference](API.md) | Every endpoint with request/response examples | …are calling or building endpoints |
| 7 | [Upload Domains](UPLOAD_DOMAINS.md) | The teams + upload-domain system in depth | …work on uploads/ingestion |
| 8 | [Extending the App](EXTENDING.md) | Recipes: add a parser, domain, promoter, or page | …want to build a feature |
| 9 | [Working with AI Agents](WORKING-WITH-AGENTS.md) | How to get good results from coding agents here | …code mostly by prompting |

## Also in the repo

- [`README.md`](../README.md) — front door / quickstart.
- [`AGENTS.md`](../AGENTS.md) — the short brief coding agents read automatically.
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — full roadmap and design rationale.
- [`prisma/schema.prisma`](../prisma/schema.prisma) — the actual database schema
  (the ultimate source of truth for data shape).

## Where things live (quick map)

```
cfb-dynasty-lore-hub/
├── README.md                 ← start here
├── AGENTS.md                 ← auto-read by coding agents
├── ARCHITECTURE.md           ← roadmap + design
├── docs/                     ← you are here
├── prisma/
│   ├── schema.prisma         ← database definition
│   ├── seed.mjs              ← seeds FBS teams + dev user
│   └── seeds/team-catalog.json ← the 134-team FBS list
└── src/
    ├── app/                  ← pages (dashboard/) + API routes (api/)
    ├── components/           ← UI building blocks
    └── lib/                  ← the brains (see below)
        ├── ingestion/        ← screenshots/manual → staging candidates
        ├── promotion/        ← approved candidates → real tables
        ├── dynasty/          ← create dynasties, pick your team
        ├── reads/            ← queries the pages use
        ├── auth/             ← "who is the current user" (stubbed for now)
        ├── ai/               ← vision provider (real Claude or a mock)
        └── storage/          ← where uploaded files are saved
```
