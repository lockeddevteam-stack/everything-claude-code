# Function audit — Exercise Library (ExLib L7761, ExerciseDetailModal L7202)


## 1. Purpose

A 225-exercise catalogue you search or drill into by muscle group, to read an exercise or hand it to the screen that summoned the picker.

## 2. Feature inventory

Captures: `screenshots/current/exercise-library-*.png` (prefix dropped below).

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Muscle-group grid (12 cards, counts) | L8553 | working | `-populated.png` |
| Group → subgroup list (23 subs) | L8402 | working | `-populated-group.png` |
| Subgroup → exercise rows | L8302 | working | `-populated-subgroup.png` |
| Search (name substring, `q.length>1`) | L8191 | weak | `-populated-search.png`: "bench" → 4 rows; no muscle/equipment match |
| "No results" | L8288 | working | `-empty.png` |
| Create Custom Exercise | L8107, `addCustom` L57304 | working | `-populated-create-custom.png` |
| Custom exercise in browse lists/counts | `mergedSub` L7774 | **broken** | seeded custom is `chest/lower`; `-populated-group.png` Lower Chest reads "10 ex", should be 11 (§6) |
| Detail sheet: notes, group, part, equipment | L7202 | working | `-detail-modal-full.png` |
| Demonstration GIF (`static.exercisedb.dev`, 227 entries) | L7311 | **broken offline** | `-detail-modal.png`: ~700px empty box, no message |
| "No animation available" fallback | L7328 | **dead** | fires only when `gifUrl` is falsy; 227 gifUrl entries cover the catalogue, so no capture shows it |
| Form video (`POST /yt-search`) | L7070, L7346-7381 | online only | "No form video found…", `-detail-modal-full.png` |
| ADD TO WORKOUT | L7463 | **dead from Library tab** | TrainHub passes no `onSelect` (L15056); handler L7861 guards `p.onSelect &&`, then closes. The sheet's primary in `-detail-modal.png` |
| `ascendFetchDetail` (`GET /exercise-detail/:id`) | L7089 | **dead** | zero call sites; page-map 2.10 lists it as live |
| Inline library inside TrainHub | L15958 | **dead** | L15377 routes `library` to `setView("library")`, never `setTab`, so `tab==="library"` is unreachable. Confirms the Train Hub auditor: `-populated.png` has no My Splits/History/Library bar; the hub is replaced |
| Back | L8494 | working | 22x27px, D12 (`targets.json`) |

Absent: favourites, recents, equipment filter, per-exercise history/PR, technique.

## 3. Task walkthrough

Only flow 1 touches this page (flow 4 and 6 tapLogs never enter it).

| Flow | Steps here | Taps | ms (flow total) |
|---|---|---|---|
| 1A cold start | Add Exercise → type "Bench" → row → ADD TO WORKOUT | 2 of 17 | 3716 |
| 1B seeded guest | same | 2 of 14 | 3090 |

No hesitation: typed search is the fast path, and ADD TO WORKOUT works from this entry. No per-step timestamp log exists (no `flow-<n>.json` in `tests/baseline/`); video at `baseline/artifacts/flows-01-*/video.webm`.

Measured by hand against the 225-item fixture (`tests/fixtures/exercise-db.json`): **browse to a named exercise = 3 taps** (group, subgroup, row) in lists of at most 10, after 2 taps to reach the library. **Search = 1 tap + 2-5 characters + 1 tap**; under 2 characters nothing renders (L8191), so "be" is the floor, returning 22 rows. Browsing without a name is the page's strength: the grid states counts, subgroup rows preview two names. Costs: equipment shows nowhere before the sheet, and "chest" returns 7 name matches, not 30.

## 4. State coverage

| State | Capture | Present? | Quality |
|---|---|---|---|
| Empty | `-empty.png` | yes | GENERIC — "No results" alone, no next action |
| Loading | `-loading.png` | **MISSING** | md5-identical (`a2c8a5f…`) to `-detail-modal.png`; test 2a fails, 2b finds no spinner, skeleton or busy control. The "Finding a form video…" branch (L7346) is below the fold |
| Error | `-error.png` | yes (GIF box gone) | **PRESENT-BUT-WRONG** — a worker abort reads "No form video found for this exercise."; the GIF failure says nothing |
| Populated | `-populated.png` | yes | correct |

A=4, M=1, W=1, G=1.

## 5. Baseline failures

No failed spec, non-responder or blocked click: populated, empty and interactive passed, 15/15 controls responded, 0 console/page errors (`page-metrics.jsonl`). Remaining defects:

- **D13** (`flow-metrics.jsonl` flow 1 `unexpectedRequests`): a detail sheet fires `POST /yt-search` (L7075) and a `static.exercisedb.dev` GIF (L7311), both unrouted. Guest mode is documented offline; this page breaks that.
- **recoveries 14 of 15 clicks** (`page-metrics.jsonl`): every group card and Create Custom replaces the screen — the takeover that kills L15958.
- `SUMMARY.md` calls the error state "not covered" over a detail fetch never called (L7089); that branch does not exist.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `-populated.png`: title, search field, "SELECT MUSCLE GROUP" — job named in under 5s. Shortfall: no single primary; 12 equal cards, search and dashed Create compete |
| Feature completeness | 2 | `-detail-modal.png`: the sheet's primary (ADD TO WORKOUT) is dead from this entry (L15056 passes no `onSelect`) above a blank 700px GIF box; L7089 and L15958 dead |
| Task success | 3 | flow 1 passes first attempt (`flow-metrics.jsonl`, pass true); from the Library tab an exercise cannot be used — workaround is starting a workout first (`-subgroup.png` rows dead-end in the sheet) |
| Speed | 4 | measured: 2 taps + 2-5 chars to a named exercise, 3 to browse (`-populated.png` → `-group.png` → `-subgroup.png`). Best-known is type-and-tap; +1 tap, the root field is not autofocused (L8523 vs L8256) |
| State handling | 1 | A=4, M=1 (loading md5-identical to the populated sheet), W=1 (`-error.png` calls a network abort "No form video found"), G=1 (`-empty.png` "No results"). Band table: M=1, W>=1 → 1 |
| Data correctness | 2 | 3 checks vs `fixtures/exercise-db.json`: `-populated.png` group counts (Chest 30, Back 40 … = 225), `-subgroup.png` Mid Chest "10 exercises", `-detail-modal-full.png` eq/group/part for Barbell Bench Press — all match. Wrong: `-group.png` Lower Chest "10 ex" omits the seeded custom (`lk_customEx` id 900001, `sid:"lower"`); `mergedSub` L7776 matches on `group`/`muscle`, which stored customs lack |
| Error recovery | 2 | `-error.png`: cause unnamed, no retry, GIF failure silent (`onError` hides the img, L7318). Nothing lost — notes persist (L7091) |

Function mean **2.6**.

## 7. Keep, fix, cut

**Keep**
- Group → subgroup → exercise browse: 3 taps, counts and previews correct.
- Per-exercise notes, autosaved and flushed on unmount (`-detail-modal.png`, survives the abort in `-error.png`).
- Create Custom Exercise with the collision-free id (L8149), persisted to `lk_customEx` (`-create-custom.png`).

**Fix**
- Render inside the Train hub instead of replacing it; delete the unreachable `tab==="library"` branch (L15958).
- `mergedSub` must match on `gid`/`sid`, so customs appear and count (Lower Chest 10 → 11).
- Hide ADD TO WORKOUT when no `onSelect` is passed (L7463); a dead primary from the Library tab.
- Search equipment and muscle, drop the 2-character floor, autofocus the field ("chest" → 7 of 30).
- Offline: name the cause once for GIF and video; add a loading skeleton so `-loading.png` differs from populated.
- Empty state should offer Create Custom Exercise, not "No results".

**Cut**
- `ascendFetchDetail` L7089 — dead code, and page-map documents a fetch that never runs.
- The Library's top-level Train tab. North star: daily actions take one tap, monthly ones live a level deeper. Picking an exercise is a step inside building a split or logging a workout, where the picker already appears (L11388, L9216); as a destination it offers nothing actionable — rows dead-end in a sheet whose primary is inert (`-detail-modal.png`).
