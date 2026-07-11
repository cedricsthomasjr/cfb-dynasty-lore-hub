# Database Reference

The database is the **single source of truth**. This page documents every table
and enum. The authoritative definition is always
[`prisma/schema.prisma`](../prisma/schema.prisma) — if this page and the schema
disagree, the schema wins (and please fix this page).

- **Engine:** PostgreSQL. **ORM:** Prisma. **IDs:** `cuid()` strings.
- **Timestamps:** most tables have `createdAt` / `updatedAt`.
- Browse the live data with `npm run db:studio`.

## Two worlds: staging vs. canonical

| | Staging | Canonical |
|--|---------|-----------|
| Tables | `Upload`, `ParseResult`, `ExtractedEntity` | everything else |
| Written by | ingestion (parsers / manual) | promotion only |
| Trust level | unverified candidates | approved, "real" |
| Read by website? | no | yes |

See [Data Flow](DATA-FLOW.md) for how a row travels from left to right.

## Table groups

### Identity & tenancy

Everything is scoped to a **Dynasty** (one save). Users control one team per
dynasty.

#### `Dynasty`
One save file / franchise. Parent of nearly everything.
- `name`, `schoolName?` (legacy hint for the user's program).
- Relations: `seasons`, `conferences`, `teams`, `players`, `coaches`, `uploads`,
  `memberships`, plus history/content tables.

#### `User`
A person. Auth is stubbed (see [API §Auth](API.md#authentication)); today there's
one seeded dev user.
- `email` (**unique**), `name?`.
- Relations: `memberships`, `uploads`.

#### `DynastyMembership`
Links a user to a dynasty and records the **one team they control**.
- `userId`, `dynastyId`, `controlledTeamId?` (null until they pick).
- **`@@unique([userId, dynastyId])`** — one membership per user per dynasty.
- **`@@unique([dynastyId, controlledTeamId])`** — one controller per team (two
  people can't run the same team). Nulls are distinct in Postgres, so many users
  can be "team not chosen yet."

### Team catalog (global)

#### `TeamCatalog`
The master FBS list, seeded once from
[`prisma/seeds/team-catalog.json`](../prisma/seeds/team-catalog.json). Not tied
to any dynasty. On dynasty creation, each row is **copied** into a `Team`.
- `slug` (**unique**), `name`, `nickname?`, `abbreviation?`, `conferenceName?`,
  `primaryColor?`, `secondaryColor?`, `defaultLogoUrl?`.

### Time

#### `Season`
A year within a dynasty.
- `dynastyId`, `year`, `label?`. **`@@unique([dynastyId, year])`**.

#### `Week`
A week within a season.
- `seasonId`, `number`, `type` (`WeekType`). **`@@unique([seasonId, number, type])`**.

### Organizations & people

#### `Conference`
A conference within a dynasty (SEC, Big Ten…). Created per distinct catalog
conference name at dynasty bootstrap.
- `dynastyId`, `name`, `abbreviation?`. **`@@unique([dynastyId, name])`**.

#### `Team`
A program **inside one dynasty** (the per-save copy of a catalog school, or a
custom team).
- `dynastyId`, `conferenceId?`, `catalogTeamId?` (null for custom teams),
  `name`, `nickname?`, `abbreviation?`, `primaryColor?`, `secondaryColor?`,
  `logoUrl?`.
- `isCustom` — true = user-added, not from the FBS catalog.
- `isUserControlled` — denormalized mirror of `DynastyMembership`; the membership
  is the source of truth, this is synced on write for fast reads.
- `sourceUploadId?` — provenance (e.g. which upload set the logo).
- **`@@unique([dynastyId, name])`**.

#### `Player`
- `dynastyId`, `teamId?`, `name`, `position?`, `jersey?`, `classYear?`
  (`ClassYear`), `heightIn?`, `weightLb?`, `hometown?`, `sourceUploadId?`.
- No unique on name (promotion find-or-creates by dynasty+team+name).

#### `Coach`
- `dynastyId`, `teamId?`, `name`, `role` (`CoachRole`), denormalized
  `careerWins` / `careerLosses`, `sourceUploadId?`.

### Games

#### `Game`
- `seasonId`, `weekId?`, `homeTeamId`, `awayTeamId`, `homeScore?`, `awayScore?`,
  `status` (`GameStatus`), `kickoff?`, `venue?`, `isRivalry`, `isNeutralSite`,
  `isConferenceGame`, `sourceUploadId?`.
- No natural unique key; promotion find-or-creates by
  (season, week, home, away).

### Stats

Football has many stat categories, so stats use typed nullable columns grouped
by category (not a generic blob).

#### `TeamGameStat`
Per-team, per-game. `gameId`, `teamId`, totals (yards, first downs, turnovers,
penalties, possession, conversions). **`@@unique([gameId, teamId])`**.

#### `PlayerGameStat`
Per-player, per-game. `gameId`, `playerId`, passing/rushing/receiving/defense/
kicking columns, `sourceUploadId?`. **`@@unique([gameId, playerId])`**.

#### `PlayerSeasonStat`
Per-player season rollup. `seasonId`, `playerId`, aggregate columns.
**`@@unique([seasonId, playerId])`**.

#### `TeamSeasonStat`
Per-team season rollup: `wins`, `losses`, `confWins/Losses`, `pointsFor/Against`.
**`@@unique([seasonId, teamId])`**.

### Snapshots (time-versioned — keep history, don't overwrite)

#### `RankingSnapshot` + `RankingEntry`
A poll at a point in time, and its ranked teams.
- Snapshot: `seasonId`, `weekId?`, `pollType` (`PollType`), `capturedAt`,
  `sourceUploadId?`. **`@@unique([seasonId, weekId, pollType])`**.
- Entry: `snapshotId`, `teamId`, `rank`, `previousRank?`, `record?`, `points?`.
  **`@@unique([snapshotId, rank])`**.

#### `ConferenceStandingSnapshot` + `StandingEntry`
A conference's standings at a point in time, and each team's line.
- Snapshot: `seasonId`, `weekId?`, `conferenceId`, `capturedAt`, `sourceUploadId?`.
  **`@@unique([seasonId, weekId, conferenceId])`**.
- Entry: `snapshotId`, `teamId`, `confWins/Losses`, `overallWins/Losses`, `rank?`.
  **`@@unique([snapshotId, teamId])`**.

### Awards, records & history (mostly future phases)

- **`Award` / `AwardWinner`** — award definitions and winners/finalists per season.
- **`SchoolRecord`** — a program's record book entries (`scope` = `RecordScope`).
- **`HistoricalRecord`** — championships, bowls, rivalries (`kind` =
  `HistoricalRecordKind`) with optional structured `data` JSON.
- **`TimelineEvent`** — dynasty timeline items (`type` = `TimelineEventType`).

### AI content (future phase)

#### `NewsArticle`
Generated articles. `type` (`ArticleType`), `status` (`ArticleStatus`),
`headline`, `body`, and crucially **`sourceData` JSON** — the exact verified
facts the article was generated from, so every claim is auditable.

### Ingestion / staging (the source-of-truth guard)

#### `Upload`
One uploaded screenshot or manual payload.
- `dynastyId?`, `userId?`, `teamId?`, `domain?` (`UploadDomain`), `inputMethod`
  (`InputMethod`), `originalName`, `storageKey`, `publicUrl?`, `mimeType`,
  `sizeBytes`, **`contentHash` (unique — idempotency)**, `screenType`
  (`ScreenType`), `status` (`UploadStatus`), `detectionConfidence?`,
  `manualPayload?` (JSON for manual uploads).
- `dynastyId` is nullable at the DB level for legacy rows but **required by the
  API** for new uploads.

#### `ParseResult`
One parse/validation run over one upload. `uploadId`, `screenType`,
`parserVersion`, `rawData` (JSON), `confidence`. Cascades from `Upload`.

#### `ExtractedEntity`
One candidate row awaiting approval. `parseResultId`, `entityType` (string, e.g.
`"RankingEntry"`), `payload` (JSON), `confidence`, `isValidated`,
`mergedIntoId?` (the canonical row id once promoted). Never read by the frontend.

## Enums

| Enum | Values (summary) | Used by |
|------|------------------|---------|
| `UploadDomain` | TEAM_LOGO, TEAM_IDENTITY, TEAM_SEASON_STATS, TEAM_GAME_STATS, PLAYER_ROSTER, PLAYER_PROFILE, PLAYER_GAME_STATS, PLAYER_SEASON_STATS, COACH_PROFILE, GAME_BOX_SCORE, RANKINGS, CONFERENCE_STANDINGS, AWARDS | `Upload.domain` |
| `InputMethod` | SCREENSHOT, MANUAL | `Upload.inputMethod` |
| `ScreenType` | DYNASTY_HOME, TOP_25, CFP_RANKINGS, CONFERENCE_STANDINGS, TEAM_SCHEDULE, TEAM_STATS, NATIONAL_LEADERS, BOX_SCORE, PLAYER_STATS, TEAM_ROSTER, AWARDS, HEISMAN_WATCH, SCHOOL_RECORDS, PLAYER_CARD, GAME_RESULTS, SEASON_STATISTICS, UNKNOWN | detector, parsers |
| `UploadStatus` | UPLOADED, DETECTING, PARSING, NEEDS_REVIEW, VALIDATED, FAILED, DUPLICATE | `Upload.status` |
| `WeekType` | PRESEASON, REGULAR, CONFERENCE_CHAMPIONSHIP, BOWL, PLAYOFF, NATIONAL_CHAMPIONSHIP, OFFSEASON | `Week.type` |
| `GameStatus` | SCHEDULED, IN_PROGRESS, FINAL | `Game.status` |
| `PollType` | AP, COACHES, CFP, PLAYOFF_COMMITTEE | `RankingSnapshot.pollType` |
| `ClassYear` | FR, SO, JR, SR, RS_FR, RS_SO, RS_JR, RS_SR | `Player.classYear` |
| `CoachRole` | HEAD_COACH, OFFENSIVE_COORDINATOR, DEFENSIVE_COORDINATOR, POSITION_COACH | `Coach.role` |
| `RecordScope` | SCHOOL, LEAGUE, CONFERENCE | `SchoolRecord.scope` |
| `HistoricalRecordKind` | NATIONAL_CHAMPIONSHIP, CONFERENCE_CHAMPIONSHIP, BOWL_APPEARANCE, BOWL_WIN, PLAYOFF_APPEARANCE, RIVALRY_RESULT, UNDEFEATED_SEASON, COACHING_MILESTONE | `HistoricalRecord.kind` |
| `TimelineEventType` | CHAMPIONSHIP, UPSET, RECORD_BROKEN, AWARD, MILESTONE, RIVALRY, COACHING_CHANGE, HISTORIC_GAME | `TimelineEvent.type` |
| `ArticleType` | BREAKING_NEWS, WEEKLY_HEADLINE, WEEKEND_RECAP, GAME_PREVIEW, GAME_RECAP, POWER_RANKINGS, AWARD_ARTICLE, CONFERENCE_RACE, CFP_RACE, RIVALRY_FEATURE, RECORD_ALERT, HISTORICAL_MILESTONE, SEASON_REVIEW | `NewsArticle.type` |
| `ArticleStatus` | DRAFT, PUBLISHED, ARCHIVED | `NewsArticle.status` |

## Relationship cheat-sheet

```
Dynasty 1─* Season 1─* Week
Dynasty 1─* Conference 1─* Team *─1 Dynasty      (Team also *─1 TeamCatalog, optional)
Dynasty 1─* Player *─1 Team                      Dynasty 1─* Coach *─1 Team
User 1─* DynastyMembership *─1 Dynasty           DynastyMembership *─1 Team (controlled)
Season 1─* Game *─2 Team (home/away)
Game 1─* TeamGameStat / PlayerGameStat
Season 1─* RankingSnapshot 1─* RankingEntry *─1 Team
Season 1─* ConferenceStandingSnapshot 1─* StandingEntry *─1 Team
Upload 1─* ParseResult 1─* ExtractedEntity        (staging)
Upload 1─* many canonical rows via sourceUploadId (provenance)
```

## Changing the schema (safely)

1. Edit [`prisma/schema.prisma`](../prisma/schema.prisma).
2. `npx prisma migrate dev --name short_description` — creates + applies a
   migration and regenerates the client.
3. Prefer **additive, nullable** changes so existing rows survive (that's how the
   teams/uploads columns were added). Avoid dropping/renaming columns with data.
4. Run `npm run typecheck` — the generated Prisma types will flag broken code.
5. If you added data the app needs at startup, update `prisma/seed.mjs`.
