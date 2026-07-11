# Concepts & Glossary

Plain-language explanations of how this project thinks. No coding required to
read this page — it's the mental model everything else builds on.

## The big idea

This app turns **screenshots from College Football 25** (and typed-in data) into
an **ESPN-style website** for your dynasty save: rankings, standings, team pages,
rosters, box scores, and eventually AI-written articles.

The hard part isn't showing the data — it's making sure the data is **true**.
A screenshot read by AI can be misread ("34" vs "84"). So the app never trusts
the AI directly. Instead:

```
   You upload a screenshot (or type data in)
            │
            ▼
   AI reads it into a draft            ← might be wrong, so it's just a "candidate"
            │
            ▼
   A human reviews & approves          ← the safety gate
            │
            ▼
   Approved data is "promoted"         ← written to the real tables
            │
            ▼
   The website shows it                ← only ever shows approved data
```

The draft/candidate area is called **staging**. The real tables are called
**canonical**. Nothing reaches canonical without a human approving it.

## Glossary (A–Z)

**Canonical (tables/data)** — the "real," trusted data the website reads from
(e.g. `Team`, `Player`, `RankingSnapshot`). Only the *promotion* step writes
here. Think of it as the published record.

**Catalog (`TeamCatalog`)** — a single global list of all ~134 FBS schools,
seeded once. When you start a dynasty, the app copies this list in so your save
already has every team. See [Upload Domains](UPLOAD_DOMAINS.md).

**Controlled team** — the one team *you* run in a dynasty (like picking your
school in the game). Each user controls exactly one team per dynasty. The app
enforces this so two people can't claim the same team.

**Custom team** — a team you add by hand that isn't in the FBS catalog (e.g. an
FCS opponent, or a relocated program). Lives only inside your dynasty.

**Detector** — the first AI step for a screenshot: "which game screen is this?"
(a Top 25 board? a box score?). Its answer picks which *parser* runs.

**Domain (`UploadDomain`)** — *what kind of data* an upload contains: a team
logo, a roster, a box score, rankings, etc. There are 13 domains. Pairs with
*input method* to describe any upload. See [Upload Domains](UPLOAD_DOMAINS.md).

**Dynasty** — one save file / franchise. Everything (teams, seasons, games,
uploads) belongs to a dynasty, so the app can hold many saves at once.

**Entity (`ExtractedEntity`)** — one candidate row waiting for approval, e.g.
"Georgia is ranked #1." Produced during staging, reviewed by a human, and turned
into a canonical row during promotion.

**FBS** — the top division of college football. The catalog holds all FBS teams.

**Idempotency** — a safety property: doing the same thing twice has no extra
effect. Re-uploading the same screenshot doesn't create duplicates; re-promoting
the same data doesn't double-write. The app hashes content to detect repeats.

**Ingestion** — the whole "get data in" process: upload → detect/parse (or
validate manual input) → stage candidates. Code lives in `src/lib/ingestion/`.

**Input method (`InputMethod`)** — *how* an upload arrived: `SCREENSHOT` (AI
reads an image) or `MANUAL` (you typed the data as JSON). Pairs with *domain*.

**Parser** — the AI step that reads a specific screen type into structured data
(e.g. the Top 25 parser reads a rankings board into a list of ranked teams).
One parser per screen type; they live in `src/lib/ingestion/parsers/`.

**Promotion** — the step that takes *approved* candidates and writes them into
canonical tables. Code lives in `src/lib/promotion/`. This is the only place
allowed to write "real" data.

**Provenance** — the paper trail. Many canonical rows store `sourceUploadId` so
you can always answer "which screenshot did this fact come from?"

**Registry** — a lookup table that maps a key to a handler, so adding a feature
means adding one file instead of editing a giant switch statement. The app has
three parallel registries: **parsers** (by screen type), **domains** (by upload
domain), and **promoters** (by entity type). See [Extending](EXTENDING.md).

**Review queue** — the `/review` page where a human approves or rejects the
candidates the AI/manual entry produced. The safety gate before promotion.

**Screen type (`ScreenType`)** — a specific in-game screen the detector/parsers
recognize (e.g. `TOP_25`, `BOX_SCORE`, `CONFERENCE_STANDINGS`).

**Season / Week** — time inside a dynasty. Games, rankings, and stats hang off a
season (a year) and optionally a week.

**Snapshot** — time-stamped data that you *want history for*, like weekly
rankings or standings. Instead of overwriting last week's Top 25, each week is
its own `RankingSnapshot`, so you can look back.

**Staging (tables/data)** — the draft area: `Upload` → `ParseResult` →
`ExtractedEntity`. Candidates live here until a human approves them. The website
never reads staging.

**Stub auth** — there's no login system yet. The app pretends everyone is one
"dev user." `getCurrentUser()` is the single spot to replace when real login is
added. See [API](API.md#authentication).

**Vision provider** — the thing that actually reads images. `mock` returns fixed
fake data (no internet, great for testing); `anthropic` uses real Claude vision
(needs an API key). Chosen by the `VISION_DRIVER` env var.

## How the pieces relate (one diagram)

```
 TeamCatalog ──copied on dynasty creation──► Team (per dynasty)
      (global list)                            ▲
                                               │ controls one
 User ──► DynastyMembership ───────────────────┘
             (one per user per dynasty, points at the controlled team)

 Upload ──► ParseResult ──► ExtractedEntity ──(approve)──► [promotion] ──► canonical tables ──► pages
  (raw)      (one parse)     (candidates)                                   (Team, Player,
                                                                            RankingSnapshot…)
```
