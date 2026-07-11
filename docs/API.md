# API Reference

All endpoints are Next.js Route Handlers under `src/app/api/`, run on the
Node.js runtime, and speak JSON. Errors are always `{ "error": "message" }` with
an appropriate status code.

Base URL in dev: `http://localhost:3000` (Next may pick 3001+ if 3000 is busy —
watch the terminal).

## Authentication

There is **no login yet**. Every request runs as a single stub user resolved by
`getCurrentUser()` (`src/lib/auth/index.ts`):

- `DEV_USER_ID` set → that exact user.
- else → upsert-by-`DEV_USER_EMAIL` (default `dev@localhost`, also seeded).

When real auth is added, only that function changes — routes stay the same. So
treat "the current user" below as "the dev user."

## Status codes used

| Code | Meaning here |
|------|--------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad input (missing/invalid field, bad manual payload) |
| 403 | Team-scoped upload didn't target your controlled team |
| 404 | Dynasty / team / upload not found |
| 409 | Conflict (team already controlled; duplicate name; no controlled team set) |
| 413 / 415 | Upload too large / unsupported file type |
| 500 | Server error (e.g. promotion failed) |

---

## Dynasties & teams

### `POST /api/dynasties`
Create a dynasty and seed **all 134 catalog teams** into it as `Team` rows (plus
a `Conference` per distinct catalog conference). Also creates your membership
(no controlled team yet).

- **Body:** `{ "name": "My Dynasty" }`
- **201:** `{ dynasty, teamCount, conferenceCount, membership }`

```bash
curl -X POST localhost:3000/api/dynasties \
  -H 'Content-Type: application/json' -d '{"name":"My Dynasty"}'
```

### `GET /api/dynasties`
List the current user's dynasties with their controlled team.
- **200:** `{ dynasties: [{ id, name, controlledTeam: { id, name } | null }] }`

### `GET /api/dynasties/[id]/teams`
Every team in a dynasty — seeded and custom — including conference name.
- **200:** `{ teams: [ … ] }` · **404** if the dynasty doesn't exist.

### `POST /api/dynasties/[id]/controlled-team`
Set your controlled team to an existing team. Swaps atomically; syncs
`Team.isUserControlled`.
- **Body:** `{ "teamId": "…" }`
- **200:** `{ team, membership }`
- **409** if that team is already controlled by someone else · **404** if the
  team isn't in this dynasty.

### `POST /api/dynasties/[id]/controlled-team/custom`
Create a **custom** team and set it as your controlled team in one call.
- **Body:** `{ "name": "Gridiron State", "nickname"?, "abbreviation"?, "primaryColor"?, "secondaryColor"? }`
- **201:** `{ team, membership }` · **409** if the name already exists.

### `POST /api/teams/custom`
Add a custom (non-controlled) team — e.g. an opponent not in the FBS catalog.
Does **not** change your controlled team.
- **Body:** `{ "dynastyId": "…", "name": "…", … }`
- **201:** `{ team }` · **409** on duplicate name.

---

## Uploads & ingestion

### `GET /api/upload/domains`
Metadata for all 13 upload domains — the contract the upload UI and future
per-domain pages build against.
- **200:** `{ domains: [{ domain, label, description, allowedInputMethods, allowedScreenTypes?, screenshotScreenType?, supportsManual, requiresControlledTeam, entityTypes }] }`

### `POST /api/upload`
Unified entrypoint. The `Content-Type` header selects the path.

**A) Screenshot — `multipart/form-data`:**
- **Fields:** `file` (image), `domain` (required), `dynastyId` (required),
  `teamId` (required for team-scoped domains — must equal your controlled team).
- **201:** `{ upload, duplicate: false }` · **200** `{ upload, duplicate: true }`
  if the same image was already uploaded.
- Accepts PNG/JPEG/WebP up to `MAX_UPLOAD_BYTES`. Then call **process** below.

```bash
curl -X POST localhost:3000/api/upload \
  -F file=@box.png -F domain=GAME_BOX_SCORE -F dynastyId=$DID
```

**B) Manual — `application/json`:**
- **Body:** `{ domain, inputMethod: "MANUAL", dynastyId, teamId?, payload }`.
  `payload` is validated against the domain's Zod schema immediately.
- Processed **inline** (no vision) — the response already includes staging.
- **201:** `{ upload, result, duplicate: false }` where `result` is a
  [ProcessResult](#processresult). · **400** with `issues` if the payload is invalid.

```bash
curl -X POST localhost:3000/api/upload -H 'Content-Type: application/json' -d '{
  "domain":"PLAYER_ROSTER","inputMethod":"MANUAL","dynastyId":"'"$DID"'","teamId":"'"$TEAM"'",
  "payload":{"players":[{"name":"Jalen Milroe","position":"QB","jersey":4,"classYear":"JR"}]}}'
```

See [Upload Domains](UPLOAD_DOMAINS.md) for each domain's rules and manual
payload shapes.

### `POST /api/uploads/[id]/process`
Run the domain-aware pipeline on a **screenshot** upload: detect (or skip when
the domain pins a screen type) → parse → stage. Manual uploads are already
processed by `/api/upload`, but re-running here is safe.
- **Body:** `{ "force"?: boolean }` — `force: true` re-processes an
  already-processed upload.
- **200:** [ProcessResult](#processresult).

### `PATCH /api/entities/[id]`
Approve or reject one staged candidate (the review-queue action).
- **Body:** `{ "action": "approve" }` → sets `isValidated = true`.
- **Body:** `{ "action": "reject" }` → deletes the candidate.
- **200** on success · **400** for any other action.

### `POST /api/uploads/[id]/validate`
**Promote** all approved candidates of this upload into canonical tables, then
mark the upload `VALIDATED`. Requires ≥1 approved entity. Idempotent.
- **200:** `{ upload, promotion: { promoted, skipped, already, items: [{ entityId, entityType, status, canonicalType?, canonicalId?, reason? }] } }`
- **400** if nothing is approved · **500** if promotion throws.

```bash
curl -X POST localhost:3000/api/uploads/$UPLOAD_ID/validate
```

---

## ProcessResult

Returned by processing (and inside manual upload responses):

```jsonc
{
  "uploadId": "…",
  "status": "NEEDS_REVIEW",     // UploadStatus
  "screenType": "BOX_SCORE",    // ScreenType
  "inputMethod": "SCREENSHOT",  // or MANUAL
  "domain": "GAME_BOX_SCORE",   // or null
  "detectionConfidence": 1,     // null for manual
  "parseConfidence": 0.83,      // present when parsed/validated
  "entityCount": 3,             // candidates staged
  "message": "…"                // present when flagged for manual review
}
```

---

## End-to-end example

The full happy path, using the mock vision driver (`VISION_DRIVER=mock`):

```bash
BASE=localhost:3000

# 1. Create a dynasty (seeds ~134 teams) and grab its id
DID=$(curl -s -X POST $BASE/api/dynasties -H 'Content-Type: application/json' \
  -d '{"name":"Demo"}' | jq -r .dynasty.id)

# 2. Pick a controlled team (Alabama)
TEAM=$(curl -s $BASE/api/dynasties/$DID/teams \
  | jq -r '.teams[] | select(.name=="Alabama") | .id')
curl -s -X POST $BASE/api/dynasties/$DID/controlled-team \
  -H 'Content-Type: application/json' -d "{\"teamId\":\"$TEAM\"}" >/dev/null

# 3. Manual roster upload (validated + staged inline)
UP=$(curl -s -X POST $BASE/api/upload -H 'Content-Type: application/json' -d "{
  \"domain\":\"PLAYER_ROSTER\",\"inputMethod\":\"MANUAL\",\"dynastyId\":\"$DID\",\"teamId\":\"$TEAM\",
  \"payload\":{\"players\":[{\"name\":\"Jalen Milroe\",\"position\":\"QB\",\"jersey\":4}]}}" \
  | jq -r .upload.id)

# 4. Approve every staged candidate for this upload
#    (in the app you'd click Approve in /review; via API, PATCH each entity id)
#    Then promote:
curl -s -X POST $BASE/api/uploads/$UP/validate | jq .promotion

# 5. See it on the site: open /players and /teams/$TEAM
```

> To approve candidates over the API you need their `ExtractedEntity` ids. Get
> them from the `/review` page, from Prisma Studio (`npm run db:studio`), or by
> querying `extractedEntity` where `parseResult.uploadId = UP`.
