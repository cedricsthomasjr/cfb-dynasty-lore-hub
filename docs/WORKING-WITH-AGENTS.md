# Working with AI Agents (Vibe Coding Guide)

This project is built to be worked on **mostly by prompting coding agents**
(Cursor, Claude Code, GitHub Copilot, etc.). You don't need to be a strong coder
to contribute — but you do need to drive the agent well and check its work. This
page shows you how.

## Why this repo is agent-friendly

- **One rule** governs the design (DB is truth; AI never invents data), so an
  agent has a clear north star. See [Concepts](CONCEPTS.md).
- **Registries** mean most features = "add one file + one line," which agents do
  reliably. See [Extending](EXTENDING.md).
- **[`AGENTS.md`](../AGENTS.md)** at the repo root is read automatically by many
  agents — it tells them the rules and where things live.
- **`npm run typecheck`** is a fast, honest "did I break it?" check.

## Before you start

1. Get it running once (see [Setup](SETUP.md)) so you can *see* your changes.
2. Keep it running: `npm run dev` in one terminal.
3. Work on a branch, not `main` (ask the agent: *"create a new branch for this
   change"*).

## How to prompt well

Give the agent **context + goal + guardrails**. A good prompt template:

> **Context:** point it at the right doc/file.
> **Goal:** what you want, in plain terms.
> **Guardrails:** the rules it must keep.

### Examples that work

> "Read `docs/EXTENDING.md` Recipe 4. Add a promoter for the `TeamGameStat`
> entity type that writes per-team box-score stats into the `TeamGameStat`
> table. Follow the existing promoters. Then run `npm run typecheck`."

> "Read `docs/API.md`. Add a `GET /api/dynasties/[id]` endpoint that returns the
> dynasty with its season count and controlled team. Match the error style
> (`{ error }`) and `runtime = "nodejs"`."

> "On the `/schedule` page (`src/app/(dashboard)/schedule/page.tsx`), replace the
> placeholder with a real page that lists this dynasty's games by week. Use
> `getActiveDynasty()` and read from the `Game` table. Copy the pattern in
> `src/app/(dashboard)/standings/page.tsx`. Show an `EmptyState` if there are no
> games."

### Prompts to avoid

- ❌ "Make the rankings better." (No target, no definition of done.)
- ❌ "Add auth." (Huge; ask it to *plan* first, then do one slice.)
- ❌ "Fix the database." (Say what's wrong and what "fixed" looks like.)

**Tip:** if a task feels big, ask the agent to *"outline a plan first, don't
write code yet."* Approve the plan, then say *"do step 1."*

## The non-negotiable rules (put these in your prompts)

Copy/paste these into prompts when relevant — they keep the app trustworthy:

- **Never write fake or placeholder data into the database or onto a page.** If
  there's no data, show an empty state.
- **Only the promotion step writes canonical tables.** Parsers/domains only
  create *candidates* in staging.
- **Every upload needs a `domain` and a `dynastyId`;** team-scoped uploads must
  target the user's controlled team.
- **Run `npm run typecheck` and fix errors before finishing.**
- **Smallest change that works.** Don't refactor unrelated code.

## How to check the agent's work (even if you don't read code)

1. **Typecheck passed?** Ask the agent to run `npm run typecheck` and show the
   result. No output = good.
2. **Does it actually work?** Try it in the running app, or ask the agent to
   demonstrate it (e.g. with the curl flow in [API.md](API.md#end-to-end-example)).
   "Show me it working" is a fair request.
3. **Did it invent data?** Open [Prisma Studio](SETUP.md) (`npm run db:studio`)
   or the page — if numbers appeared that you never uploaded, that's a red flag.
4. **Is the diff small?** Ask: *"summarize exactly what files you changed and
   why."* Lots of unrelated changes = ask it to narrow down.
5. **Commit** only when you're happy: *"commit this on the current branch with a
   clear message"* (the agent won't push unless you ask).

## Common tasks → which doc to hand the agent

| You want to… | Point the agent at… |
|--------------|---------------------|
| Read a new screenshot type | [EXTENDING.md](EXTENDING.md) Recipe 1 |
| Support a new upload category | [EXTENDING.md](EXTENDING.md) Recipe 2–3 + [UPLOAD_DOMAINS.md](UPLOAD_DOMAINS.md) |
| Turn approved data into real rows | [EXTENDING.md](EXTENDING.md) Recipe 4 |
| Build/finish a page | [EXTENDING.md](EXTENDING.md) Recipe 5 |
| Add or change an endpoint | [API.md](API.md) |
| Change what's stored | [DATABASE.md](DATABASE.md) |
| Understand how data moves | [DATA-FLOW.md](DATA-FLOW.md) |

## If something breaks

- **Read the error out loud to the agent.** Paste the full message from the
  terminal or browser. Agents fix specific errors far better than vague ones.
- **Undo safely:** `git status` (what changed), `git restore <file>` (discard a
  file's changes), or *"revert your last change."* Because you work on a branch,
  `main` stays safe.
- **Reset the database** if staging/canonical data gets messy in dev:
  `npx prisma migrate reset` (wipes + re-seeds — dev only).

## Golden workflow (memorize this loop)

```
branch → prompt with a doc + clear goal → agent codes → typecheck →
try it in the app → looks right? commit → repeat.  Ask to push only when ready.
```
