# Function audit — Exercise Library (ExLib L7761-8624, ExerciseDetailModal L7202-7760)

## 1. Purpose

A 225-exercise catalogue you search or drill into by muscle group, to read an exercise's details or hand it to whatever screen summoned the picker.

## 2. Feature inventory

| Feature | Component / line | Status | Evidence |
|---|---|---|---|
| Muscle-group grid (12 cards, counts) | ExLib L8553-8598 | working | `exercise-library-populated.png` |
| Group → subgroup list (23 subgroups) | L8402-8517 | working | `exercise-library-populated-group.png` |
| Subgroup → exercise rows | L8302-8399 | working | `exercise-library-populated-subgroup.png` |
| Search (name substring, `q.length>1`) | L8191-8296 | working, weak | `exercise-library-populated-search.png`: "bench" → 4 rows, no muscle/equipment matching |
| "No results" | L8288-8296 | working | `exercise-library-empty.png` |
| Create Custom Exercise | L8107-8189, `addCustom` L57304 | working | `exercise-library-populated-create-custom.png` |
| Custom exercise in browse lists/counts | `mergedSub` L7774-7783 | **broken** | seeded custom is `chest/lower`; `exercise-library-populated-group.png` shows Lower Chest "10 ex", should be 11 (§6 Data) |
| Detail sheet: notes, group, part, equipment | L7202-7480 | working | `exercise-library-populated-detail-modal-full.png` |
| Demonstration GIF (`static.exercisedb.dev`, 227 entries) | L7311-7327 | **broken offline** | `-detail-modal.png`: ~700px empty box, no message; `onError` only hides the img |
| "No animation available" fallback | L7328-7343 | **dead** | only fires when `gifUrl` is falsy; 227 of 225 built-ins carry one, so it never renders in any capture |
| Form video (`POST /yt-search`) | L7070-7086, L7346-7381 | working online only | "No form video found for this exercise." in `-detail-modal-full.png` |
| ADD TO WORKOUT | L7463-7476 | **dead from Library tab** | TrainHub passes no `onSelect` (L15056-15061); handler L7861 fires `p.onSelect &&` then closes. Button is the sheet's primary in `-detail-modal.png` |
| `ascendFetchDetail` (`GET /exercise-detail/:id`) | L7089 | **dead** | zero call sites (grep, whole file); page-map 2.10 lists it as a live fetch |
| Inline library inside TrainHub | TrainHub L15958 | **dead** | tab handler L15377 routes `library` to `setView("library")`, never `setTab`, so `tab==="library"` is unreachable. Confirms the Train Hub auditor: `exercise-library-populated.png` shows no My Splits/History/Library bar — the hub is replaced |
| Back | L8494 | working | 22x27px, `targets.json` |

Absent: favourites, recents, filter by equipment, per-exercise history/PR, technique text.

## 3. Task walkthrough

Only flow 1 touches this page (flows 4, 6 tapLogs never enter it).

| Flow | Steps here | Taps | ms (whole flow) | Hesitation |
|---|---|---|---|---|
| 1A cold start | Add Exercise → type "Bench" → row → ADD TO WORKOUT | 2 of 17 | 3716 | none; typed search is the fast path |
| 1B seeded guest | same | 2 of 14 | 3090 | same |

No per-step timestamp log exists (`flow-<n>.json` absent from `tests/baseline/`); videos are under `baseline/artifacts/flows-01-*/video.webm`.

Measured by hand against the 225-item fixture (`tests/fixtures/exercise-db.json`): **browse to one named exercise = 3 taps** (group, subgroup, row) plus a scroll in a 10-row list — and 2 taps before that to reach the library. **Search = 1 tap into the field + 2-5 characters + 1 tap**; below 2 characters nothing renders (L8191), so "be" is the floor and returns 22 rows. Browsing without a name works and is the page's strength: the grid states counts, subgroup rows preview two exercise names. Two costs: the root screen shows equipment nowhere, and searching "chest" returns 7 (name matches only), not the 30 chest exercises — a user who thinks in muscles must abandon search for the grid.

## 4. State coverage

| State | Capture | Present? | Quality |
|---|---|---|---|
| Empty | `exercise-library-empty.png` | yes | GENERIC — "No results" alone; no Create Custom Exercise offer, no next action |
| Loading | `exercise-library-loading.png` | **MISSING** | byte-identical (md5 `a2c8a5f…`) to `exercise-library-populated-detail-modal.png`; presence test 2a fails, and 2b finds no spinner, skeleton or busy control. The "Finding a form video…" branch (L7346-7355) sits below the fold |
| Error | `exercise-library-error.png` | yes (GIF box gone) | **PRESENT-BUT-WRONG** — a worker abort renders "No form video found for this exercise."; the GIF failure produces no message at all |
| Populated | `exercise-library-populated.png` | yes | correct |

A=4, M=1, W=1, G=1.

## 5. Baseline failures

No failed spec, non-responder or blocked click on this page: populated, empty and interactive all passed, 15/15 controls responded, 0 console/page errors (`page-metrics.jsonl`). Findings that are still defects:

- **D13** (`flow-metrics.jsonl`, flow 1 `unexpectedRequests`): opening a detail sheet fires `POST /yt-search` (L7075) and a `static.exercisedb.dev` GIF (L7311) unrouted by the harness. Guest mode is documented as fully offline; this page breaks that.
- **D12**: Back 22x27 (`targets.json`), 2 of 21 targets under 44px — the page's only target failures.
- **recoveries 14 of 15 clicks** (`page-metrics.jsonl` interactive): every group card and Create Custom replaces the screen, so the crawler had to re-enter each time — the same full-screen takeover that kills the inline branch at L15958.
- Error state is listed "not covered" in `SUMMARY.md` because `ascendFetchDetail` is never called (L7089); the branch it names does not exist.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `exercise-library-populated.png`: title, search field, "SELECT MUSCLE GROUP" — job named in under 5s. Shortfall: no single primary; 12 equal cards + search + dashed Create compete |
| Feature completeness | 2 | `-detail-modal.png` shows the sheet's primary (ADD TO WORKOUT) dead from this entry (L15056 passes no `onSelect`) and a blank 700px GIF box; `ascendFetchDetail` L7089 and TrainHub L15958 dead |
| Task success | 3 | flow 1 passes first attempt (`flow-metrics.jsonl`, 14/17 taps, pass true); browsing to an exercise from the Library tab has no way to use it — workaround is to start a workout first (`exercise-library-populated-subgroup.png` rows lead only to the sheet) |
| Speed | 4 | measured: 2 taps + 2-5 chars to a named exercise, 3 taps to browse to one (`-populated.png` → `-group.png` → `-subgroup.png`). Best-known is type-and-tap; +1 tap because the root field is not autofocused (L8523, no `autoFocus`, unlike L8256) |
| State handling | 1 | A=4, M=1 (loading md5-identical to populated detail modal), W=1 (`exercise-library-error.png` calls a network abort "No form video found"), G=1 (`exercise-library-empty.png` "No results"). Band table: M=1 and W>=1 → 1 |
| Data correctness | 2 | 3 checks vs `fixtures/exercise-db.json`: group counts in `-populated.png` (Chest 30, Back 40 … = 225) match; Mid Chest "10 exercises" in `-subgroup.png` matches; Barbell Bench Press eq/group/part in `-detail-modal-full.png` match. Wrong: `-group.png` Lower Chest "10 ex" omits the seeded custom `lk_customEx` (id 900001, `sid:"lower"`) because `mergedSub` L7776 matches on `group`/`muscle`, which stored customs lack — the exercise is invisible in browse and uncounted |
| Error recovery | 2 | `exercise-library-error.png`: cause not named, no retry, and the GIF failure is silent (`onError` hides the img, L7318). Nothing is lost — notes persist (L7091-7117) |

Function mean **2.6**.

## 7. Keep, fix, cut

**Keep**
- Group → subgroup → exercise browse; 3 taps, counts and name previews correct (`-group.png`, `-subgroup.png`).
- Per-exercise notes with autosave and flush-on-unmount (`-detail-modal.png` shows seeded note; survives the abort in `-error.png`).
- Create Custom Exercise, including the collision-free id (L8149-8156); persists to `lk_customEx`.

**Fix**
- Render the library inside the Train hub instead of replacing it; delete the unreachable `tab === "library"` branch (L15958, L15377).
- `mergedSub` must match on `gid`/`sid`, so customs appear and count (Lower Chest 10 → 11).
- Hide ADD TO WORKOUT when no `onSelect` was passed (L7463); it is a dead primary from the Library tab.
- Search: match equipment and muscle, drop the 2-character floor, autofocus the field ("chest" → 7 of 30).
- Offline: name the cause once for GIF and video, keep the sheet usable; render a real loading skeleton so `-loading.png` differs from populated.
- Empty state should offer Create Custom Exercise, not "No results" alone.

**Cut**
- `ascendFetchDetail` L7089 — dead code, and page-map documents a fetch that never runs.
- The Library's claim on a top-level Train tab. North star item 1: daily actions take one tap, monthly actions live one level deeper. Picking an exercise is a step inside building a split or logging a workout, where the picker already appears (L11388, L9216); as a standalone destination it does nothing a lifter can act on — every row dead-ends in a sheet whose primary button is inert. It belongs one level deeper, reached from the picker contexts.
