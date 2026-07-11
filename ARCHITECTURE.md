# CFB Dynasty Lore Hub — Architecture & Roadmap

> An ESPN-quality media platform for a College Football 25 dynasty save.
> **Source of truth is the database.** Vision extracts → DB stores → Frontend visualizes → AI presents.
> AI never invents stats, scores, players, or events.

---

## 1. Implementation Roadmap (Phases)

### Phase 1 — Foundation (this deliverable)
Scaffolding, Prisma schema, env config, layout/nav shell, raw upload endpoint (store only, no parsing), dashboard skeleton with placeholder pages.
**Exit criteria:** App runs, DB migrates, a screenshot can be uploaded and persisted as an `Upload` row + stored file, nav reaches every planned page.

### Phase 2 — Ingestion Pipeline (Vision → Structured Data)
- Screen-type **detector** (classifier over the uploaded image).
- Modular **parser registry** — one parser per screen type behind a common `Parser` interface.
- Confidence scoring per field; a **staging** layer (`ParseResult` / `ExtractedEntity`) that is reviewed/validated before it mutates canonical tables.
- **Idempotency + merge**: dedupe repeated uploads, reconcile conflicting values by confidence + recency.
- Human-in-the-loop **review queue** UI for low-confidence extractions.

### Phase 3 — Canonical Data & Core Read Pages
Promote validated staging data into canonical entities. Build the real data-backed pages: Rankings (Top 25 / CFP), Standings, Schedule, Game Center, Team pages, Player/Coach profiles. Everything reads from canonical tables.

### Phase 4 — Historical Memory & Aggregations
Season rollups, career aggregates, championship/bowl/rivalry records, School Records, League Records, Season History, Dynasty Timeline. Denormalized snapshot tables + materialized aggregates for fast reads.

### Phase 5 — AI Content Engine
Deterministic **data-context assembler** builds a strictly-typed "facts packet" from the DB; the LLM only *narrates* it. Content types: Breaking News, Weekly Headlines, Recaps, Previews, Power Rankings, Award/Record/Milestone articles, Season Reviews. Every article stores its `sourceData` provenance so claims are auditable.

### Phase 6 — Polish, Search, Realtime
Global search (Postgres FTS / trigram), dynasty timeline visualizations, image/theme polish to ESPN quality, caching, background jobs, notifications.

### Phase 7 (Future, architected-for-not-built) — Recruiting, NIL, Transfer Portal
New entities + parsers + pages plug into the same ingestion registry and content engine. No refactor of core required.

---

## 2. Reasoning Behind Phase Ordering

- **Data integrity before presentation.** The product's entire value rests on "AI never lies." That is only enforceable if the ingestion → staging → validation → canonical flow exists *before* any AI writes prose. So the pipeline (P2) and canonical layer (P3) precede the content engine (P5).
- **Foundation first (P1)** de-risks everything: schema shape drives every later phase, so we lock a well-normalized schema early even though most tables stay empty until later phases.
- **Staging before canonical.** Vision is probabilistic; canonical tables must be trustworthy. A separate staging layer means bad extractions never corrupt the source of truth, and repeated uploads can be merged deterministically.
- **Historical memory (P4) before AI (P5)** because good ESPN-style writing *references history* ("first title since…"). The content engine is far more valuable once the historical context tables exist.
- **AI last** so it is a pure consumer of verified data — the cleanest way to guarantee it can't invent facts.
- **Recruiting explicitly last** and isolated so the core ships and stabilizes first; the ingestion registry + content-type registry are the extension seams.

---

## 3. Recommended Architectural Improvements

1. **Dynasty as a top-level entity.** Wrap everything under a `Dynasty` so the platform supports multiple saves / rebuilds without schema changes. Cheap now, expensive to retrofit.
2. **Staging layer separate from canonical tables** (`Upload → ParseResult → ExtractedEntity → (validated) → canonical`). Protects the source of truth and makes the merge/dedupe logic testable in isolation.
3. **Parser registry pattern.** A `Map<ScreenType, Parser>` with a shared interface (`detect`, `parse`, `confidence`, `validate`). Adding a screen type = adding one file; no switch-statement sprawl.
4. **Provenance everywhere.** Every canonical row carries `sourceUploadId` / confidence, and every AI article stores the exact `factsPacket` it was generated from. Enables audit, regeneration, and trust.
5. **Snapshot tables for inherently time-versioned data** (Rankings, Standings) keyed by `(seasonId, week)` — you *want* history, not overwrites.
6. **Deterministic facts-assembler between DB and LLM.** The LLM receives structured JSON, never raw DB access, and is prompted to narrate-only. This is the technical enforcement of the core philosophy.
7. **Storage abstraction** (`lib/storage`) so local-disk in dev swaps to S3/R2 in prod without touching route handlers.
8. **Idempotency keys on uploads** (content hash) so the same screenshot re-uploaded is detected, not duplicated.
9. **Type-safe enums shared** between Prisma and the app via generated client + a `types` barrel, so screen types / positions / award kinds never drift.

---

## 4. Potential Risks & Bottlenecks

| Risk | Impact | Mitigation |
|---|---|---|
| Vision mis-reads stats/scores | Corrupts "source of truth" | Confidence thresholds + staging + human review queue (P2); never write canonical directly from vision |
| Duplicate / conflicting uploads | Double-counted stats | Content-hash idempotency + deterministic merge by confidence+recency |
| LLM hallucination in articles | Breaks core promise | Facts-packet assembler; narrate-only prompts; store provenance; validate entities referenced exist |
| Schema churn | Painful migrations later | Lock normalized schema in P1; additive migrations; `Dynasty` + snapshot tables reduce future reshaping |
| Screen-type ambiguity (similar layouts) | Wrong parser runs | Classifier confidence + fallback to manual screen-type selection in review UI |
| Image storage growth | Cost / perf | Storage abstraction, thumbnails, offload originals to object storage |
| Vision API cost/latency | Slow ingestion, spend | Batch, cache by content-hash, async job queue, only re-parse on demand |
| Stat model rigidity (CFB has many stat categories) | Awkward queries | Category-typed stat tables with nullable columns per category, not a generic EAV blob |

---

## 5. Database Schema

Full Prisma schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). Design highlights:

- **Hierarchy:** `Dynasty → Season → Week → Game`. Conferences, Teams, Players, Coaches hang off the Dynasty.
- **Ingestion (staging):** `Upload` (raw file + content hash + detected `ScreenType` + status) → `ParseResult` (per-parser JSON + confidence) → `ExtractedEntity` (candidate rows awaiting validation). Canonical tables are only written after validation.
- **Snapshots:** `RankingSnapshot` + `RankingEntry` and `ConferenceStandingSnapshot` + `StandingEntry` are keyed by `(seasonId, week)` to preserve history.
- **Stats:** `TeamGameStat`, `PlayerGameStat` (per-game) and `PlayerSeasonStat`, `TeamSeasonStat` (rollups) with football-specific nullable columns grouped by category.
- **Historical memory:** `Award`/`AwardWinner`, `SchoolRecord`, `HistoricalRecord`, `TimelineEvent` persist championship/bowl/rivalry/award/career/milestone history.
- **Content:** `NewsArticle` stores type, body, status, and a `sourceData` JSON provenance packet linking back to the verified data it was generated from.
- **Provenance:** most canonical rows carry `sourceUploadId` + optional `confidence`.

---

## 6. Folder Architecture

```
cfb-dynasty-lore-hub/
├── prisma/
│   └── schema.prisma            # full normalized schema (all entities)
├── public/uploads/              # dev: publicly served thumbnails (gitignored)
├── storage/                     # dev: original screenshot bytes (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # root layout: fonts, theme, app shell
│   │   ├── globals.css          # Tailwind + design tokens
│   │   ├── page.tsx             # League Home
│   │   ├── (dashboard)/         # route group: all data pages share the shell
│   │   │   ├── weekly/…         # Weekly Dashboard
│   │   │   ├── news/…           # Latest News
│   │   │   ├── rankings/…       # Top 25
│   │   │   ├── cfp/…            # CFP Rankings
│   │   │   ├── standings/…      # Conference Standings
│   │   │   ├── games/…          # Game Center
│   │   │   ├── schedule/…       # Schedule
│   │   │   ├── teams/…          # Team pages
│   │   │   ├── players/…        # Player profiles
│   │   │   ├── coaches/…        # Coach profiles
│   │   │   ├── awards/…         # Awards
│   │   │   ├── records/…        # School + League records
│   │   │   ├── history/…        # Season History
│   │   │   ├── timeline/…       # Dynasty Timeline
│   │   │   ├── search/…         # Search
│   │   │   └── upload/…         # Upload UI (drives the endpoint)
│   │   └── api/
│   │       └── upload/route.ts  # POST: store file + Upload row (no parsing yet)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (button, card, …)
│   │   ├── layout/              # Sidebar, Topbar, AppShell, nav config
│   │   └── shared/              # PagePlaceholder, StatTile, etc.
│   ├── lib/
│   │   ├── prisma.ts            # singleton Prisma client
│   │   ├── storage/             # storage abstraction (local ↔ S3 later)
│   │   ├── ingestion/           # Phase-2 seams: parser registry (interfaces only in P1)
│   │   │   └── parsers/
│   │   ├── utils.ts             # cn() + helpers
│   │   ├── nav.ts               # single source of truth for navigation
│   │   └── constants.ts
│   └── types/                   # shared TS types / enums barrel
├── components.json              # shadcn config
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

**Extension seams for Phase 7:** new screen types drop into `lib/ingestion/parsers/`, new entities are additive Prisma models, new pages are new route folders, new AI content types register in the content-type map — none require touching core.
