# CLAUDE.md

Guidance for Claude Code (and other coding agents) working in this repo.

**Read [`AGENTS.md`](AGENTS.md) first** — it's the canonical brief (rules,
registry patterns, where things live). This file just points you there so
Claude Code picks it up automatically.

## Fast orientation

- **The one rule:** the database is the single source of truth; the AI never
  invents data. Ingestion only *stages candidates* → a human approves them →
  only *promotion* writes canonical tables → pages read canonical only (show an
  empty state, never fabricate data).
- **Docs hub:** [`docs/INDEX.md`](docs/INDEX.md). Key pages:
  [Database](docs/DATABASE.md), [API](docs/API.md), [Data Flow](docs/DATA-FLOW.md),
  [Extending](docs/EXTENDING.md).
- **Extend via registries** (parser / domain / promoter): one file + one line.
  Recipes in [`docs/EXTENDING.md`](docs/EXTENDING.md).
- **Always run `npm run typecheck`** before finishing. Use `VISION_DRIVER=mock`
  for offline work. Don't commit/push unless asked.
