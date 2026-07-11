# Data Flow

How a screenshot (or a typed-in payload) becomes something the website shows.
This is the backbone of the whole app. Read [Concepts](CONCEPTS.md) first if the
words "staging" and "canonical" are new.

## The pipeline at a glance

```
┌──────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐   ┌────────────┐
│  UPLOAD  │──►│   INGESTION  │──►│    STAGING    │──►│    REVIEW    │──►│ PROMOTION  │──► pages
│ image or │   │ detect+parse │   │ ParseResult + │   │ human clicks │   │ write to   │
│  JSON    │   │  OR validate │   │ ExtractedEntity│  │ approve/reject│  │ canonical  │
└──────────┘   └──────────────┘   └───────────────┘   └──────────────┘   └────────────┘
   POST            POST                (DB rows)          PATCH               POST
 /api/upload   /api/uploads/:id/process               /api/entities/:id   /api/uploads/:id/validate
```

Nothing between UPLOAD and PROMOTION touches the "real" tables. That gap is the
whole safety story: probabilistic AI output is quarantined in staging until a
human signs off.

## Step by step

### 1. Upload — `POST /api/upload`

Two shapes, one endpoint (see [API](API.md#post-apiupload)):

- **Screenshot** (multipart): an image file + `domain` + `dynastyId` (+ `teamId`
  for team-scoped domains). The bytes are stored on disk; an `Upload` row is
  created with a SHA-256 `contentHash`. Re-uploading the same image returns the
  existing row instead of duplicating (idempotency).
- **Manual** (JSON): `{ domain, inputMethod: "MANUAL", dynastyId, teamId?, payload }`.
  The payload is validated against that domain's Zod schema right away, so bad
  data is rejected with a clear `400` before anything is stored.

Both are validated by `resolveUploadRequest` (`src/lib/ingestion/upload-request.ts`),
which enforces the **domain → team binding rules**: team-scoped domains must
target *your controlled team*. See [Upload Domains](UPLOAD_DOMAINS.md).

### 2. Ingestion — `POST /api/uploads/[id]/process`

Driven by `src/lib/ingestion/pipeline.ts`, which branches on the upload's
`inputMethod`:

- **Screenshot path (vision):**
  - If the domain *pins* a screen type (e.g. `GAME_BOX_SCORE` → `BOX_SCORE`), the
    matching **parser** runs directly — detection is skipped (faster, reliable).
  - Otherwise the **detector** (`detector.ts`) classifies the screen, and the
    parser for that screen type runs. Low confidence → the upload is flagged
    `NEEDS_REVIEW` with no parse.
  - The actual reading is done by the **vision provider** (`src/lib/ai/`): `mock`
    (canned data) or `anthropic` (real Claude).
- **Manual path (no vision):** the stored payload is re-validated against the
  domain's Zod schema and turned straight into candidates.

Either way, the output is one `ParseResult` plus a set of `ExtractedEntity`
candidates, and the upload's status becomes `NEEDS_REVIEW`.

> For screenshots, the `/upload` UI page calls `/api/upload` then
> `/api/uploads/:id/process` automatically. Manual uploads are processed inline
> by `/api/upload` itself.

### 3. Staging — the candidate tables

Three tables hold the in-progress data (never read by the website):

- **`Upload`** — the raw file/payload + metadata (domain, method, team, hash).
- **`ParseResult`** — one parser/validation run over one upload, with an overall
  confidence score and the raw structured data.
- **`ExtractedEntity`** — individual candidate rows, e.g. one per ranked team,
  each with its own confidence and an `entityType` like `RankingEntry`.

### 4. Review — `/review` page + `PATCH /api/entities/[id]`

A human opens the **review queue**, sees each candidate (with its confidence,
domain, input method, and team), and clicks **approve** or **reject**. Approving
sets `ExtractedEntity.isValidated = true`. Rejecting deletes the candidate. This
is the trust gate.

### 5. Promotion — `POST /api/uploads/[id]/validate`

Once at least one candidate is approved, validating the upload runs
`promoteUpload` (`src/lib/promotion/`). In a single transaction it:

1. Loads every *approved* entity for the upload, in order.
2. For each, finds its **promoter** by `entityType` and writes a canonical row —
   find-or-creating supporting rows (Season, Week, Team, Conference, Player) and
   upserting on natural unique keys so re-runs don't duplicate.
3. Stamps provenance (`sourceUploadId`) and records `ExtractedEntity.mergedIntoId`.
4. Marks the upload `VALIDATED`.

Entities it can't resolve (e.g. a ranking with no season year) are **skipped**
and reported, not fatal. Entity types with no promoter yet stay
"validated-but-unpromoted." The response includes a summary:
`{ promoted, skipped, already, items[] }`.

### 6. Read pages — canonical only

Pages like `/rankings`, `/standings`, `/teams`, `/players` query the canonical
tables through helpers in `src/lib/reads/` and `src/lib/dynasty/active.ts`
(which picks "the current dynasty"). If a table is empty they show an honest
empty state — **the app never fabricates data to fill a page.**

## Status lifecycle of an Upload

```
UPLOADED ──process──► DETECTING ─► PARSING ─► NEEDS_REVIEW ──validate──► VALIDATED
                                    │
   (manual skips DETECTING/PARSING) │
                                    └─► (low confidence / no parser) ─► NEEDS_REVIEW
   any error ─► FAILED        identical re-upload ─► DUPLICATE
```

(Enum: `UploadStatus` in [`schema.prisma`](../prisma/schema.prisma); see
[Database](DATABASE.md#enums).)

## Where each step lives in code

| Step | Code |
|------|------|
| Upload validation & binding rules | `src/lib/ingestion/upload-request.ts` |
| Upload endpoint | `src/app/api/upload/route.ts` |
| Pipeline (detect/parse/manual) | `src/lib/ingestion/pipeline.ts` |
| Detector | `src/lib/ingestion/detector.ts` |
| Parsers (by screen type) | `src/lib/ingestion/parsers/` |
| Domain handlers (by upload domain) | `src/lib/ingestion/domains/` |
| Vision provider (mock/anthropic) | `src/lib/ai/` |
| Review actions | `src/app/api/entities/[id]/route.ts` |
| Promotion engine | `src/lib/promotion/` |
| Validate + promote endpoint | `src/app/api/uploads/[id]/validate/route.ts` |
| Read queries | `src/lib/reads/`, page files in `src/app/(dashboard)/` |
