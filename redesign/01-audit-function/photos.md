# Function audit — Progress Photos (`photos`, ProgressPhotos L30585-31491)

## 1. Purpose
Take, store and browse dated body photos on this device, and send one to an AI for physique feedback.

## 2. Feature inventory

| Feature | Line | Status | Note |
|---|---|---|---|
| Camera button (capture input) | L30810 | working | `photos-populated.png`; crawl responded |
| Library button (file input) | L30860 | working | `photos-populated.png`; crawl responded |
| Optional note field | L30786 | working | crawl responded; note renders on tile ("Week 5") |
| Month grouping + 3-col grid | L30723, L30960 | working | AUGUST/JULY headings, `photos-populated.png` |
| Lightbox (open, close, Escape) | L31056, L30596 | working | `photos-populated-lightbox.png` |
| Prev / next / "2 / 2" counter | L31414, L31450, L31467 | working | `photos-populated-lightbox.png` |
| Delete (double-tap confirm) | L31451 | working | visible in lightbox capture; skipped by crawl as destructive |
| ANALYSE PHYSIQUE (POST /analyze-physique) | L31169, L30626 | working | `photos-loading.png`, `photos-error.png` |
| Analysis result card | L31203-31380 | hidden | no capture exists; needs a live worker reply, unreachable in the harness |
| "Add <muscle> work to…" split writer | L31364-31394 | hidden | two levels deep: inside the result card, and only if `p.splits` non-empty |
| Compare / side-by-side | — | absent | no `compare`/`before` match in L30585-31491; `photos-populated-lightbox.png` shows only Analyse, Delete, arrows, close. `addTarget` (page-map 2.4 "compare") is the split writer above, not a compare view |
| "N photos · stored on device" | L30770 | broken | `photos-populated.png` says stored on device, but `lk_progressPhotos` is in SYNC_KEYS (L195) and is uploaded to the worker (L561) once signed in |
| Quota-full second save | L2440, L30690 | broken | toast fires once per session; later failures return silently, photo lost with no message |

Data, plainly: photos are base64 JPEGs in `lk_progressPhotos` in localStorage, inside a shared ~5 MB origin budget (L2467). In guest mode that is the only copy — clearing site data destroys the whole history. Signed in, they are pushed last, best-effort, in their own request, and a key over 450 KB is skipped with a `console.warn` only (L533, L555-L562): a long photo history can stop syncing silently while the label still reads "stored on device".

## 3. Task walkthrough
No flow in `user-flows.md` touches this page (flow 4 passes through ProgressPage to PR Vault), so there is no `flow-metrics.jsonl` row or video timestamp. Paths as reached by the harvester (`screenshots/index.md`):

| Task | Steps | Taps | Evidence | Hesitation |
|---|---|---|---|---|
| Open Photos | Home → scroll → "VIEW PROGRESS" → tab "Photos" | 2 | `photos-populated.png` | Progress has no nav tab; it hangs off the 8th Home block (user-flows §Flow 4 note) |
| Add a photo | Camera or Library → OS picker | 1 + OS | `photos-empty.png` | two equal-weight buttons, no default; note field sits above them, order reversed from the act |
| View one full size | tap tile | 1 | `photos-populated-lightbox.png` | tile is the only affordance; no visible open/expand hint |
| Get AI feedback | tile → ANALYSE PHYSIQUE | 2 | `photos-loading.png` | none, the button is the loudest thing on screen |
| Compare two dates | — | — | not reachable | this is the job the page exists for; nothing offers it |

Page interactive crawl: 10/11 controls clicked, 0 non-responders, 0 blocked, 7618 ms (`page-metrics.jsonl` photos/interactive).

## 4. State coverage

| State | Capture | Present? | Test | Quality |
|---|---|---|---|---|
| Empty | `photos-empty.png` | yes | 2b: camera medallion + "Start Your Transformation" + instruction, absent from populated | correct |
| Loading | `photos-loading.png` | yes | 2a: diff vs `photos-populated-lightbox.png` (same sheet, offset, theme) — button becomes spinner + "Analysing…", disabled L31173 | correct |
| Error | `photos-error.png` | yes | 2a: same frame plus red toast "Couldn't analyse that photo. Check your connection and try again." | correct: names cause and next step, photo and lightbox survive |
| Populated | `photos-populated.png`, `-lightbox`, `-full`, `-scrolled-2` | yes | — | correct: 2 photos, month headings, notes |

A = 4, M = 0, W = 0, G = 0. Blank grey thumbnails in the captures are the seed `thumb` `TINY_JPEG` (`gen-seed.mjs` L162-165), a fixture artefact, not a defect.

## 5. Baseline failures
None. `photos` populated / empty / error all passed; 0 console errors, 0 page errors, 0 non-responders (`SUMMARY.md` photos row). Non-pass findings on the row: axe 1 violation, 1 node — `meta-viewport` `user-scalable=no`, the global shell, counted once per page; targets 8/17 under 44 px — Back 22x27 (L28592), the five Progress tabs at 33 px high (L28619), Camera and Library 156x41 (L30810, L30860); contrast 0/18 fail with 10 unknown (image-backed tiles).

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `photos-populated.png`: title "Progress Photos", one capture card, grid below; shortfall — Camera and Library are styled as co-primaries, so the primary action count is 2 |
| Feature completeness | 3 | Inventory above: core add/view/delete/analyse work; result card and split writer hidden (no capture reaches them); compare absent; "stored on device" wrong when signed in (`photos-populated.png` vs L195/L561) |
| Task success | 4 | All three page specs passed, crawl 10/11 with 0 non-responders (`page-metrics.jsonl`); shortfall — no user-flow covers the page and the only two-photo task, comparison, has no path |
| Speed | 4 | Add photo = 1 tap from the entry state (`photos-empty.png` Camera), matching best-known; +1 because the entry state itself needs a scrolled Home block, Progress having no nav tab |
| State handling | 5 | A=4, M=0, W=0, G=0; `photos-empty.png`, `photos-loading.png` (2a diff vs `photos-populated-lightbox.png`), `photos-error.png`, `photos-populated.png` |
| Data correctness | 4 | 3 checks vs `gen-seed.mjs` L162-165: today-41 → "Jul 29 / Week 1, relaxed", today-13 → "Aug 26 / Week 5", count "2 photos", lightbox "2 / 2" (`photos-populated.png`, `-lightbox`); shortfall — "stored on device" is false for a signed-in user |
| Error recovery | 4 | `photos-error.png`: cause named, fix offered, photo and lightbox kept, button re-enabled (L30690); shortfall — a second quota-full save in one session is silent (L2440 `_lkQuotaWarned`, L30690 bare return) |

Function mean **4.0**.

## 7. Keep, fix, cut
**Keep**
- Camera / Library / note capture card — `photos-empty.png`, crawl responded, 1 tap.
- Month grouping and dated tiles — `photos-populated.png`, matches seed dates.
- Analysis error toast — `photos-error.png`: cause, fix, work kept.

**Fix**
- Add compare: two-photo side-by-side is the page's reason to exist and nothing reaches it (`photos-populated-lightbox.png`).
- Lightbox layout: controls sit at the top over an empty frame (`photos-populated-lightbox.png`); photo should own the frame.
- "stored on device" → say what is synced (L195, L561).
- Silent second quota failure (L30690) must surface per failure, not once per session.
- Surface the split writer: today it needs a live analysis plus an existing split (L31364).
- Targets: Back 22x27 and the 33 px tabs fail 44 px (`targets.json`).

**Cut**
- Nothing. Every visible control serves the north star; the defect here is absence, not excess.
