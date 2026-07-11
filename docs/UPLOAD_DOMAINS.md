# Upload Domains, Team Catalog & Membership (Phase 2.5)

This document describes the foundation added on top of the Phase 2 ingestion
pipeline: a global team catalog, per-user team control, and a two-axis upload
model (**domain × input method**). No canonical promotion happens here — every
path still ends in the staging tables (`ParseResult` / `ExtractedEntity`) for
human review. Promotion remains Phase 3.

## 1. Three-layer team model

| Layer            | Model                              | Scope             | Purpose                                  |
| ---------------- | ---------------------------------- | ----------------- | ---------------------------------------- |
| Catalog          | `TeamCatalog`                      | Global            | Master FBS school list (seeded once)     |
| Dynasty instance | `Team`                             | Per dynasty       | A school inside one save                 |
| User control     | `DynastyMembership.controlledTeamId` | Per user, per dynasty | The single team a user manages     |

- **On dynasty creation** every `TeamCatalog` row is copied into a
  dynasty-scoped `Team` (one `Conference` per distinct catalog conference name).
  See `src/lib/dynasty/bootstrap.ts`.
- **Custom team**: a `Team` with `catalogTeamId = null` and `isCustom = true`.
  Dynasty-scoped only; never touches the global catalog.
- **`Team.isUserControlled`** is a denormalized mirror of the membership, synced
  on every controlled-team write. `DynastyMembership` is the source of truth.

### One-team-per-user rule (enforced in DB **and** API)

Two DB uniques on `DynastyMembership` back the invariant:

```prisma
@@unique([userId, dynastyId])            // one membership per user per dynasty
@@unique([dynastyId, controlledTeamId])  // one controller per team (NULLs distinct)
```

Setting a controlled team is a **swap**, not an accumulate: the previous team's
`isUserControlled` flag is cleared and the membership is repointed inside a
transaction. A second user grabbing a team already controlled by someone else
fails with `P2002` → the API returns `409`.

## 2. Stub auth

There is no auth provider yet. `getCurrentUser()` (`src/lib/auth/index.ts`) is
the single identity seam:

- `DEV_USER_ID` set → look up that exact `User` (must exist).
- otherwise → upsert-by-email using `DEV_USER_EMAIL` (default `dev@localhost`),
  which the seed also creates.

Wiring real auth later means changing that function's body only — no route or
service signatures change.

## 3. Upload domains (two axes)

Every upload is tagged with a **domain** (what it carries) and an **input
method** (how it arrived).

- `UploadDomain` — 13 values (see `prisma/schema.prisma`).
- `InputMethod` — `SCREENSHOT` (vision) or `MANUAL` (typed JSON).

### Domain → team binding rules (enforced in `resolveUploadRequest`)

| Domains                                                                                                                   | `teamId` required?             | Must be controlled team? |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------ |
| `TEAM_LOGO`, `TEAM_IDENTITY`, `TEAM_SEASON_STATS`, `TEAM_GAME_STATS`, `PLAYER_ROSTER`, `PLAYER_PROFILE`, `PLAYER_GAME_STATS`, `PLAYER_SEASON_STATS`, `COACH_PROFILE` | Yes | Yes |
| `RANKINGS`, `CONFERENCE_STANDINGS`, `AWARDS`                                                                              | No                             | N/A                      |
| `GAME_BOX_SCORE`                                                                                                          | Optional (resolved at promotion) | N/A                    |

## 4. Domain registry

`src/lib/ingestion/domains/` is the domain registry — parallel to the parser
registry. One handler file per domain, registered in `domains/index.ts`. A
completeness guard throws in dev if any `UploadDomain` value lacks a handler.

Each `DomainHandler` declares: `allowedInputMethods`, an optional
`screenshotScreenType` (routes straight to an existing parser, skipping
detection), an optional `manualSchema` (Zod), `requiresControlledTeam`, and the
`entityTypes` it stages.

### Registry inventory

| Domain                 | Screenshot → parser (`screenshotScreenType`) | Manual Zod schema |
| ---------------------- | -------------------------------------------- | ----------------- |
| `TEAM_LOGO`            | —                                            | ✅ `team-logo`     |
| `TEAM_IDENTITY`        | —                                            | ✅ `team-identity` |
| `TEAM_SEASON_STATS`    | `TEAM_STATS`                                 | —                 |
| `TEAM_GAME_STATS`      | `BOX_SCORE`                                  | —                 |
| `PLAYER_ROSTER`        | `TEAM_ROSTER`                                | ✅ `player-roster` |
| `PLAYER_PROFILE`       | `PLAYER_CARD`                                | —                 |
| `PLAYER_GAME_STATS`    | `PLAYER_STATS`                               | ✅ `player-game-stats` |
| `PLAYER_SEASON_STATS`  | `SEASON_STATISTICS`                          | —                 |
| `COACH_PROFILE`        | — (falls back to detector)                   | —                 |
| `GAME_BOX_SCORE`       | `BOX_SCORE`                                  | —                 |
| `RANKINGS`             | — (detector picks `TOP_25` / `CFP_RANKINGS`) | —                 |
| `CONFERENCE_STANDINGS` | `CONFERENCE_STANDINGS`                        | —                 |
| `AWARDS`               | `AWARDS`                                     | —                 |

Domains whose `screenshotScreenType` points at a screen type without a
registered parser yet (e.g. `TEAM_ROSTER`, `PLAYER_STATS`) fall back to the
detector automatically until that parser lands.

## 5. Pipeline paths

`src/lib/ingestion/pipeline.ts` dispatches on `Upload.inputMethod`:

- **Screenshot** — if the domain pins a `screenshotScreenType` with a registered
  parser, route straight to it (`detectionConfidence = 1`, no vision detect);
  otherwise fall back to the existing detector.
- **Manual** — validate `Upload.manualPayload` against the domain's `manualSchema`,
  build candidates via the handler's `buildManualEntities`, and stage them
  directly at confidence `1.0`. No vision.

Both paths end at `status = NEEDS_REVIEW`. Idempotency: screenshots hash their
bytes; manual uploads hash `domain + teamId + canonical(payload)`.

## 6. API routes

| Method + path                                    | Purpose                                           |
| ------------------------------------------------ | ------------------------------------------------- |
| `POST /api/dynasties`                            | Create a dynasty + seed all catalog teams         |
| `GET  /api/dynasties`                            | List the current user's dynasties + controlled team |
| `GET  /api/dynasties/:id/teams`                  | List all teams in a dynasty (seeded + custom)     |
| `POST /api/dynasties/:id/controlled-team`        | Set controlled team from an existing team         |
| `POST /api/dynasties/:id/controlled-team/custom` | Create a custom team + set it as controlled       |
| `POST /api/teams/custom`                         | Add a custom (non-controlled) opponent team       |
| `GET  /api/upload/domains`                       | Domain registry metadata (UI/contract)            |
| `POST /api/upload`                               | Unified upload: multipart screenshot **or** JSON manual |
| `POST /api/uploads/:id/process`                  | Domain-aware processing                            |

All routes run on `runtime = "nodejs"` and use the `{ error: string }` shape.

### Example: create a dynasty and stage data

```bash
# 1. Create dynasty (copies ~134 catalog teams into Team rows)
DID=$(curl -s -X POST localhost:3000/api/dynasties \
  -H 'Content-Type: application/json' -d '{"name":"My Dynasty"}' \
  | jq -r .dynasty.id)

# 2. Pick a controlled team
ALA=$(curl -s localhost:3000/api/dynasties/$DID/teams \
  | jq -r '.teams[] | select(.name=="Alabama") | .id')
curl -s -X POST localhost:3000/api/dynasties/$DID/controlled-team \
  -H 'Content-Type: application/json' -d "{\"teamId\":\"$ALA\"}"

# 3. Manual PLAYER_ROSTER upload (validated, staged, no vision)
curl -s -X POST localhost:3000/api/upload -H 'Content-Type: application/json' -d "{
  \"domain\":\"PLAYER_ROSTER\",\"inputMethod\":\"MANUAL\",
  \"dynastyId\":\"$DID\",\"teamId\":\"$ALA\",
  \"payload\":{\"players\":[{\"name\":\"Jalen Milroe\",\"position\":\"QB\",\"jersey\":4}]}}"

# 4. Screenshot GAME_BOX_SCORE upload (domain-aware; skips detection)
UP=$(curl -s -X POST localhost:3000/api/upload \
  -F file=@box.png -F domain=GAME_BOX_SCORE -F dynastyId=$DID | jq -r .upload.id)
curl -s -X POST localhost:3000/api/uploads/$UP/process \
  -H 'Content-Type: application/json' -d '{}'
```

## 7. Planned upload pages (documented, **not built**)

The backend contract exists; these pages are a Phase 2.5 follow-up. See
`UPLOAD_ROUTES` in `src/lib/nav.ts` (not wired into the nav yet).

```
/upload                     # hub (future)
/upload/team/logo
/upload/team/stats
/upload/players/roster
/upload/players/profile
/upload/players/stats
/upload/coaches
/upload/games/box-score
/upload/league/rankings
/upload/league/standings
```

## 8. Phase 3 — canonical promotion (implemented)

Validated `ExtractedEntity` rows are now promoted into canonical tables by the
promotion engine (`src/lib/promotion/`), triggered from
`POST /api/uploads/[id]/validate`. See `ARCHITECTURE.md` § Phase 3 for the
registry pattern. Promoters exist for `RankingSnapshot`/`RankingEntry`,
`ConferenceStandingSnapshot`/`StandingEntry`, `Game`, `PlayerGameStat`, `Player`,
`TeamLogo`, and `TeamIdentity` (the last two write onto the canonical `Team`).
Read pages (Top 25, CFP, Standings, Teams, Players) render the promoted data.

### Still open

- Per-domain upload pages (§7) — still not built.
- Promoters for entity types no producer emits yet (team season/game stats,
  awards, coach profiles); box-score `TeamGameStat`.
- Schedule / Game Center / Coach pages and stat rollups (Phase 3/4).
- Replace stub auth with a real provider (swap `getCurrentUser`).
