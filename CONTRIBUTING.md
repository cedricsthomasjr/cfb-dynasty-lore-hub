# Contributing

Thanks for working on the CFB Dynasty Lore Hub! Most contributions here happen
**by prompting coding agents** — that's expected and supported. This file is the
short version; the details live in [`docs/`](docs/INDEX.md).

## The one rule (don't break it)

**The database is the single source of truth, and the AI never invents data.**
Ingestion only stages *candidates*; a human approves them; only the promotion
step writes the real tables; pages read real data only (show an empty state, not
fake data). See [Concepts](docs/CONCEPTS.md).

## Before you start

1. Get it running: [Setup](docs/SETUP.md).
2. Work on a **branch**, not `main`.
3. If using an AI agent, read [Working with AI Agents](docs/WORKING-WITH-AGENTS.md).

## Adding a feature

The app uses **registries** so features are usually "add one file + one line."
Full recipes (parser, upload domain, promoter, page, endpoint) are in
[Extending the App](docs/EXTENDING.md).

## Conventions

- **Validate at boundaries** with Zod.
- **DB access** through the `prisma` singleton only.
- **Errors:** throw typed errors from services; routes return `{ error }` + a
  status code.
- **Idempotency:** upsert on unique keys / hash content so repeats are safe.
- **Smallest correct diff.** No unrelated refactors. Match nearby style.

## Definition of done

- [ ] `npm run typecheck` passes.
- [ ] You tried the change in the running app (or showed it working via the
      [curl flow](docs/API.md#end-to-end-example)).
- [ ] No fake data written to the DB or a page.
- [ ] The diff is scoped to the task.
- [ ] Commit with a clear message. **Push only when asked / ready.**

## Reference

- [Documentation index](docs/INDEX.md) · [Database](docs/DATABASE.md) ·
  [API](docs/API.md) · [Architecture](ARCHITECTURE.md) · [`AGENTS.md`](AGENTS.md)
