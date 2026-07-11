# Extending the App

The app is built around **three registries** so that adding a capability means
**adding one file and one line**, never editing a big `switch`. This page is the
recipe book. Each recipe is small enough to hand to a coding agent verbatim —
see [Working with AI Agents](WORKING-WITH-AGENTS.md).

| Registry | Keyed by | Files | "Add one" =  |
|----------|----------|-------|--------------|
| **Parsers** | `ScreenType` | `src/lib/ingestion/parsers/` | read a new screenshot type |
| **Domains** | `UploadDomain` | `src/lib/ingestion/domains/` | a new *kind* of upload |
| **Promoters** | `entityType` | `src/lib/promotion/promoters/` | write a new canonical type |

The golden rule (from [`AGENTS.md`](../AGENTS.md)): **ingestion only stages
candidates; only promotion writes canonical tables; pages read canonical only.**

---

## Recipe 1 — Add a screenshot parser (new `ScreenType`)

Use when there's a new in-game screen you want to read from an image.

1. **Add the screen type** to the `ScreenType` enum in
   [`prisma/schema.prisma`](../prisma/schema.prisma), then
   `npx prisma migrate dev --name add_<screen>_screen_type`.
2. **Create** `src/lib/ingestion/parsers/<name>.ts` exporting a `Parser`. Copy
   `top25.ts` as a template: define a Zod schema for what the AI should return,
   call `runVisionTool`, and return `{ confidence, data, entities }`. Each
   `entity` has an `entityType` string (this is what a promoter will match).
3. **Register it** — add one line in `src/lib/ingestion/parsers/index.ts`.
4. (Optional) Add a **mock fixture** in `src/lib/ai/mock-driver.ts` keyed by your
   tool name so it works offline.
5. Typecheck: `npm run typecheck`.

---

## Recipe 2 — Add an upload domain (new `UploadDomain`)

Use for a new *category* of data (a new screenshot page or manual form).

1. **Add the value** to the `UploadDomain` enum in the schema and migrate.
2. **Create** `src/lib/ingestion/domains/<name>.ts` exporting a `DomainHandler`.
   Decide:
   - `allowedInputMethods` — `SCREENSHOT`, `MANUAL`, or both.
   - `screenshotScreenType?` — if set, screenshots skip detection and go straight
     to that parser. (Leave unset to fall back to the detector.)
   - `manualSchema?` — a Zod schema (see Recipe 3) if it supports manual input.
   - `requiresControlledTeam` — `true` for team-scoped domains.
   - `entityTypes` — the candidate types it produces.
   - `buildManualEntities?` — turns a validated manual payload into candidates.
3. **Register it** in `src/lib/ingestion/domains/index.ts`. A built-in guard
   throws if any `UploadDomain` value lacks a handler, so you can't forget.
4. Typecheck.

See [Upload Domains](UPLOAD_DOMAINS.md) for the existing handlers as examples.

---

## Recipe 3 — Add a manual (typed-in) schema

Use when a domain should accept typed JSON instead of / in addition to a
screenshot.

1. **Create** `src/lib/ingestion/manual/schemas/<name>.ts` exporting a Zod
   schema (copy `player-roster.ts`). Mirror the canonical columns; make fields
   optional where the game does.
2. Reference it from the domain handler's `manualSchema`, and map it to
   candidates in `buildManualEntities`.
3. That's it — `POST /api/upload` (JSON) validates against it automatically.

---

## Recipe 4 — Add a promoter (write a new canonical type)

Use when an `entityType` produced by a parser/domain has no canonical writer yet
(it currently shows as `skipped: no promoter registered`).

1. **Create** `src/lib/promotion/promoters/<name>.ts` exporting a `Promoter`.
   Copy `ranking.ts` or `player.ts`. In `promote(ctx, payload)`:
   - Read fields with the `str/int/num` helpers from `../field`.
   - Resolve supporting rows with `../resolve` (`resolveSeason`, `resolveWeek`,
     `resolveTeam`, `resolveConference`, `resolvePlayer`).
   - **Upsert** on the table's natural unique key so re-runs don't duplicate.
   - Stamp `sourceUploadId: ctx.uploadId` where the column exists.
   - `throw new PromotionSkip("reason")` if it can't be resolved (recorded, not
     fatal).
   - Return `{ canonicalType, canonicalId }`.
2. **Register it** in `src/lib/promotion/promoters/index.ts`.
3. Typecheck, then test the full flow (upload → approve → validate) and confirm
   the row appears (Prisma Studio or the relevant page).

> `ctx.lastGameId` lets child stat lines attach to a game promoted earlier in the
> same upload — that's how box-score player stats find their game.

---

## Recipe 5 — Add / fill in a read page

Pages live in `src/app/(dashboard)/<route>/page.tsx`. Data pages should:

1. Get the current dynasty with `getActiveDynasty()` (`src/lib/dynasty/active.ts`).
2. Query **canonical** tables via the `prisma` singleton (put reusable queries in
   `src/lib/reads/`).
3. Render with the shared UI (`PageHeader`, `Card`, `Badge`, `RankingTable`) and
   show `EmptyState` when there's no data — **never fabricate rows**.
4. Add `export const dynamic = "force-dynamic";` so it always reflects the DB.

Copy `src/app/(dashboard)/rankings/page.tsx` as a template. If the page needs a
new nav entry, add it to `src/lib/nav.ts`.

---

## Conventions (match these)

- **Validation:** Zod at every boundary; parse, don't assume.
- **Errors from services:** throw a typed error (`BootstrapError`,
  `UploadRequestError`, `PromotionSkip`) carrying a status; routes map it to
  `{ error }` + code.
- **DB access:** always the `prisma` singleton (`src/lib/prisma.ts`). Never
  `new PrismaClient()` in app code.
- **Idempotency:** hash content / upsert on unique keys so repeats are safe.
- **Smallest correct diff.** No drive-by refactors. Match nearby style.
- **Always run `npm run typecheck`** before you commit. The generated Prisma
  types catch most mistakes for free.
