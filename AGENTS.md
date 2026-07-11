# AGENTS.md — working notes for the CFB Dynasty Lore Hub

Read `ARCHITECTURE.md` for the full roadmap and `docs/UPLOAD_DOMAINS.md` for the
teams + upload-domain foundation. This file is the fast orientation.

## Core invariant (do not violate)

The **database is the single source of truth**. Vision/manual input →
**staging** (`ParseResult`, `ExtractedEntity`) → **human review** → **canonical
promotion**. AI and UI never invent stats. Nothing writes canonical tables
outside the promotion path (`src/lib/promotion`, Phase 3) — ingestion only ever
stages candidates, and read pages render only what the DB holds (never fake
data; use `EmptyState` when a canonical table is empty).

## Registry patterns (extend by adding a file, never a switch)

- **Parser registry** (`src/lib/ingestion/registry.ts`, parsers in
  `parsers/`): one `Parser` per `ScreenType`. Register in `parsers/index.ts`.
- **Domain registry** (`src/lib/ingestion/domains/`): one `DomainHandler` per
  `UploadDomain`. Register in `domains/index.ts`. A guard throws if any
  `UploadDomain` value lacks a handler. Adding a domain = one handler file +
  one `registerDomain()` line.
- **Promotion registry** (`src/lib/promotion/`): one `Promoter` per
  `ExtractedEntity.entityType`. Register in `promoters/index.ts`. `promoteUpload`
  runs all of an upload's approved entities in one transaction; it's idempotent
  (skips entities already carrying `mergedIntoId`) and records unresolvable ones
  as skips instead of failing. Entity types without a promoter stay
  validated-but-unpromoted. Adding one = one promoter file + one line.

Use the existing seams: `getStorage()`, `getVision()`, the `prisma` singleton,
`runVisionTool` + Zod for extraction, and staging-only writes.

## Teams: three layers

- `TeamCatalog` — global FBS master list, seeded once (`npm run db:seed`).
- `Team` — per-dynasty copy of the catalog; custom teams have
  `catalogTeamId = null`, `isCustom = true`.
- `DynastyMembership.controlledTeamId` — the one team a user controls.

Create dynasties/teams **only through** `src/lib/dynasty/bootstrap.ts`
(`createDynasty`, `setControlledTeam`, `setControlledTeamCustom`,
`addCustomTeam`). It keeps `Team.isUserControlled` in sync with membership.

### One-team-per-user rule

Enforced in DB (`@@unique([userId, dynastyId])` and
`@@unique([dynastyId, controlledTeamId])`) **and** API. Changing a controlled
team is a swap inside a transaction, not an accumulate. Two users on one team →
`P2002` → `409`.

## Uploads: domain × input method

Every upload carries a `domain` (`UploadDomain`) and `inputMethod`
(`SCREENSHOT` | `MANUAL`), both required by the API. `resolveUploadRequest`
(`src/lib/ingestion/upload-request.ts`) validates them and enforces the
domain→team binding: team-scoped domains must target the caller's controlled
team. The pipeline (`pipeline.ts`) dispatches on `inputMethod`:

- **Screenshot** — domain-pinned parser (skip detect) or detector fallback.
- **Manual** — validate `manualPayload` against the domain's Zod schema; stage
  candidates directly at confidence 1.0 (no vision).

## Stub auth

`getCurrentUser()` (`src/lib/auth`) is the only identity resolver: `DEV_USER_ID`
or upsert-by-`DEV_USER_EMAIL` (default `dev@localhost`). Real auth plugs in by
changing that function's body — routes/services don't change.

## Commands

```bash
npm run typecheck            # tsc --noEmit — must pass
npx prisma migrate dev       # apply schema changes
npx prisma db seed           # seed TeamCatalog (134 FBS teams) + dev user
npm run dev                  # http://localhost:3000
```

## Guardrails

- Smallest correct diff; no drive-by refactors.
- Don't fake data on placeholder pages.
- Don't add the planned `/upload/*` subpages yet (see `UPLOAD_ROUTES` in
  `src/lib/nav.ts`) — the backend contract exists; the pages are a follow-up.
- Manual `TEAM_LOGO` stages a `TeamLogo` entity only; it does **not** write
  `Team.logoUrl` (that is Phase 3 promotion).
