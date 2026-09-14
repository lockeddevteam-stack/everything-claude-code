### F-BETA-001 — Beta code system
- location: `2698` (`DEFAULT_BETA_CODES`), `2699-2721` (`initBetaCodes`), `2723-2728` (`validateBetaCode`), `2729-2756` (`validateBetaCodeRemote`), `2757-2771` (`claimBetaCode`).
- user action: 
- behaviour: 1. `DEFAULT_BETA_CODES = ["JOSHBETA","SUMMERBETA","ROMANBETA","CESCOBETA","PUBLICBETA","OLIBETA","KENDALLBETA"]` — **7 codes, hardcoded in the client** (2698). 2. `initBetaCodes()` runs immediately at 2722; it merges any missing default into `lk_betaCodes` as `{code, active:true, usedBy:null}`. 3. `validateBetaCode(code)` — local only: uppercase-trims and returns true if the code exists, is `active`, and has no `usedBy` (2723-2728). 4. `validateBetaCodeRemote(code, onResult)` — local check first, then `POST /beta-validate` with `{code}` and **no auth header** (2731-2744). `!d.valid` → "Invalid code"; `d.locked` → "This code is no longer available"; else success. **On any network failure it calls `onResult(true, null)` — fail-open** (2754). 5. `claimBetaCode(code, userId)` marks the local entry `usedBy`/`claimedAt` and writes `lk_betaStatus = true`, `lk_betaCode`, `lk_betaId` = lowercase code (2757-2771). The `userId` passed in is the *username string*, not a Supabase uid (33490, 34315). - **Entry points**: Settings (33420 validate, 33490 claim) and onboarding (34110 validate, 34315 claim).
- v6 status: WORKING; security-relevant (see findings).

### F-BETA-002 — Silent beta
- location: `2795-2799`.
- user action: 
- behaviour: `SILENT_BETA_IDS = ["summerbeta"]`; `isSilentBeta()` lowercases `lk_betaId` and tests membership. Used at 33512 to hide the beta UI section in Settings while beta logging still runs.
- v6 status: WORKING.

### F-BETA-003 — Activity & AI logging
- location: `2772-2783` (`logBetaActivity`), `2784-2793` (`logBetaAI`).
- user action: 
- behaviour: both no-op unless `lk_betaStatus` is true. `logBetaActivity(action, data)` appends `{ts, action, data, betaId}` to `lk_betaLog`; `logBetaAI(input, output)` appends `{ts, input, output, betaId}` to `lk_betaAILog` (called from `aiCall` at 2687). Both arrays are **unbounded** and both are uploaded by `syncBetaData`. - **Call sites**: 30+ across the app — workout_saved (57441), progress_photo (2872), weight_log (2930), form_video_opened (7360), goal_*/bf_logged (27138-27182), physique_focus_added (30616), refeed_* (37029-37036), shopping_list_exported (42575), restock/staple (43530-43596), supplement_* (46201-46369), compound_taken (47351-47471), cycle_* (47582-47602), persona_changed (49576), coach_* (49963-50512).
- v6 status: WORKING. - **Privacy risk**: `logBetaAI` stores full prompt and response text, and `syncBetaData` uploads it unauthenticated.

### F-BETA-004 — Beta admin panel
- location: component at `52806`, route at `57709-57711` (`screen === "betaAdmin"`, mapped to the `profile` tab in `Nav`, 57958). Not read in detail — outside this agent's exclusive range; **UNVERIFIED**, owned by whichever agent covers 52806. ---
- user action: 
- behaviour: 
