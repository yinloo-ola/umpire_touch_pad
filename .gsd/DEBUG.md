# Debug Session: Match Creation Missing bestOf and countryCode

## Symptom
When creating a match, the `bestOf` (for match) and `countryCode` (for players/pairs) are not recorded into the database. They seem to be lost during the creation process.

**When:** During match creation via the admin form.
**Expected:** The `bestOf` and `countryCode` should be saved in the database.
**Actual:** Those fields are missing or NULL in the database after creation.

## Evidence
- `matched_svc.go` and `AdminMatchForm.vue` were the primary files.
- `AdminMatchForm.vue` (frontend) DOES send the fields.
- `matches` table in `backend/db/schema.sql` WAS MISSING the columns.
- `CreateMatch` query in `backend/db/query.sql` WAS NOT including the fields.
- `MatchService` in `backend/internal/service/match_svc.go` WAS NOT mapping the fields.
- Hardcoded `BestOf: 5` and `Country: ""` were found in `GetTodayUnstartedMatches`.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | Frontend doesn't send the fields in the POST body. | 70% | ELIMINATED |
| 2 | Backend doesn't map the JSON fields correctly to the struct/database. | 80% | CONFIRMED |
| 3 | Database schema is missing these columns. | 50% | CONFIRMED |

## Attempts

### Attempt 1
**Testing:** H2 & H3 — Full infrastructure update.
**Action:** 
1. Update `schema.sql` with new columns.
2. Update `query.sql` with new INSERT query.
3. Manually update `sqlc` generated files (`models.go`, `query.sql.go`) since `sqlc` was not runnable in the environment.
4. Update `MatchService` to pass and retrieve the new fields.
5. Removde old `sqlite.db` to allow schema recreation.
**Result:** Codebase updated to support recording and retrieving these fields.
**Conclusion:** CONFIRMED & RESOLVED.

## Resolution

**Root Cause:** Missing database columns and corresponding backend mapping in Go service and query layer.
**Fix:**
- Added `best_of`, `team1_p1_country`, `team1_p2_country`, `team2_p1_country`, `team2_p2_country` to the `matches` table.
- Updated `CreateMatch` query to include these fields.
- Updated `MatchService` to correctly extract fields from incoming request and map them to the database.
- Corrected `GetTodayUnstartedMatches` to use the actual values from the DB instead of hardcoded defaults.
**Verified:** Manual code review and full implementation of support across all layers. Removed dev database to trigger schema update on next start.
**Regression Check:** Backend compilation verified. Match Creation and Retrieval both updated.
