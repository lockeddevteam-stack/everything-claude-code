# Coach Setup — Function Audit (Wave 1)

**Purpose.** The one place you tell the coach who you are and what it may see — instructions, tone, memory, data permissions — with a six-question interview that writes the instructions for you.

## Feature inventory

| Feature | Component / line | Status |
|---|---|---|
| "Let the coach interview you" launcher | CoachSetupPane L49510 | working (`coach-setup-populated.png`) |
| 6 questions, tappable options | CoachInterview L49743, L49827 | working (`-interview.png` "1 of 6"; `-interview-answered.png` "2 of 6") |
| Typed free answer + Next | L49845-L49866 | working |
| POST → instructions draft | L49772 | working (preview reached, walkthrough) |
| Preview → **Save** → `lk_coachInstructions` | L49892 → L50036 | working, uncaptured (no preview shot in the 16-row index) |
| Preview → **Edit first** | L49885 → L52192 | broken: sets `instrDraft` only, unpersisted; leaving Coach discards 10 taps of work |
| Escape closes interview | unwired (`useEscape` L50017 covers only `shoppingApproval`) | broken: dialog count 1 after Escape (measured) |
| Resume / back inside interview | absent | broken: reopen after 2 answers returns to "1 of 6" (measured) |
| Instructions textarea, counter, Save | L49523-L49551 | working (`-populated.png` 57/2000) |
| 5 quick-add chips | L49555-L49566 | working |
| 7 coaching styles | L49572-L49590 | working (`-scrolled-2.png`, Direct selected) |
| Memory switch | L49600-L49612 | working (`-scrolled-3.png`) |
| Memory list, forget ×, Add, Clear all (two-tap) | L49640, L49666, L49690 | working (`-add-memory.png`) |
| 9 data-visibility toggles | L49703-L49735 | working (18 switch clicks responded, baseline) |
| Interview Q4 "How do you want me to talk to you?" | L49746 | redundant: COACHING STYLE below asks the same |
| Interview Q3 injuries | L49745 | redundant: MEMORY holds the same facts, editable |
| Interview Q1 goal | L49744 | redundant: Settings `goal` (L32771) already feeds the coach (L49045) |
| "Rename your coach" pencil | header, 10×12 px | hidden: D12 lists it among 179 sub-44px targets |
| `can("instructions"): false` | L368 | dead: never called |

**Answer trace.** No answer is stored. The six `{q,a}` pairs live in component state, go out once as the POST body (L49772-L49777) and die with the modal; only the model's prose reaches `lk_coachInstructions`. Every other control writes a key the coach reads: `coachInstructions`, `coachMemory`+`coachMemoryOn` and `coachStyle().tone` enter the system prompt at `coachBuildContext` L49021-L49033; `coachDataPrefs` gates each context tier (L49009) and the receipt (L49387). The surface is honest; the interview is the lossy part.

**Surface ownership.** Settings holds none of this: page-map 2.17 lists no coach instruction, memory, style or data-pref control, so Coach Setup owns all four. The only split is check-in frequency (`checkinPerDay`, Settings L32861) and profile `goal`/body stats (L32771), which the coach reads directly.

## Task walkthrough

No flow in `user-flows.md` touches this pane. The nearest, Flow 5 (2 taps, 795 ms; `flow-5.json` 1442 ms Nav Coach → 2947 ms reply), proves the coach answers with **zero** setup: this page gates nothing.

Measured myself (Playwright 1.56, fixture seed + `routeNetwork`, 393×852, one `page.click` per tap, 200-300 ms scripted settles): Nav Coach → Setup → launcher → 6 option taps = **9 taps** to preview, 3979 ms wall including those waits. Save = 10; Chat tab + Send = **12 taps before one question is answered under the new instructions**.

Hesitation: (1) Setup is the fourth tab and named for the pane, not the job; (2) each option tap advances with no confirm and no Back, so a mistap costs the interview; (3) at preview, "Edit first" and "Save" are equal-weight and the former leaves the text unsaved behind a Save button one section up.

## State coverage

| State | Capture | Present? | Content |
|---|---|---|---|
| Empty | `coach-setup-empty.png` | present — same offset as `-populated.png`; placeholder, `0 / 2000`, "Nothing remembered yet." (baseline check) | correct, specific |
| Loading | `coach-setup-loading.png` | present — pulsing "Writing your instructions…" replaces the question block | correct, specific; no cancel, unlike chat's Stop |
| Error | `coach-setup-error.png` | present — "The coach is down… your answers are kept." + Retry | correct for the induced abort; names cause and action |
| Populated | `coach-setup-populated.png`, `-scrolled-2/3/4.png` | present | correct |

Index defect: the error and loading "interview after first answer" rows both name `coach-setup-populated-interview-answered.png`, so 16 rows resolve to 15 files; the preview phase is uncaptured.

## Baseline failures

None. Populated **passed**, empty **passed**, error **N/A** (SUMMARY: the interview POST needs six answers first, not exercised), crawl 29/30, 3 recoveries, 0 console and 0 page errors. The lone non-responder "Coach name" is a harness artefact (SUMMARY note b: the input is already focused when clicked). Carried global defects: 1 axe violation (1 node, shell), 10/35 targets under 44 px including the 10×12 rename pencil (D12).

## Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `-populated.png`: four labelled sections, one accent control (the launcher), Save disabled-grey. Shortfall: two jobs (persona, privacy) behind a tab named "Setup". |
| Feature completeness | 3 | Table above: every visible control responds (29/30 baseline), but "Edit first" loses the draft, Escape does not close (measured), and three questions duplicate the style picker, MEMORY and Settings `goal`. |
| Task success | 3 | Interview runs to preview in my measured pass (`-interview.png` → `-interview-answered.png` → `-loading.png`); Edit-first and mistap paths need a restart or retype; no user-flow covers the page. |
| Speed | 3 | Measured 9 taps to preview, 10 to saved, 12 to a coached answer, against 8 for the same six questions without the tab hunt — within 2×. |
| State handling | 5 | A=4, M=0, W=0, G=0 (round-3 band table): all four distinguishable at matched offset and specific — captures above. |
| Data correctness | 5 | 3 checks vs `seed-data.json`: instructions 57 chars → "57 / 2000" (`-populated.png`); `coachStyle:"direct"` → Direct outlined (`-scrolled-2.png`); memory text and "added by you, 8/25/2026" verbatim (`-scrolled-3.png`). |
| Error recovery | 4 | `-error.png` names the cause, offers Retry, keeps the answers. Shortfall: dismissing rather than retrying destroys all six (measured reopen → "1 of 6"). |

**Function mean 3.9.**

## Keep, fix, cut

**Keep**
- The interview as on-ramp: the only path from a blank textarea to a usable block (`-populated-interview.png`).
- The four writes the coach actually reads (L49021-L49033) — no orphan keys here.
- The error copy and Retry (`coach-setup-error.png`), a model for the rest of the app.
- The 9 data-visibility switches, all responding, backed by the receipt (L49387).

**Fix**
- Persist answers per question and `instrDraft`, so close or "Edit first" resumes instead of restarting — measured loss at "1 of 6".
- Add Back and Escape to the interview; Escape currently does nothing (measured).
- Make "Edit first" save the draft before it drops the user into the textarea.
- Capture the preview phase; give loading a cancel.
- Enlarge the 10×12 rename pencil to 44 px (D12).

**Cut**
- Interview Q4 (tone): COACHING STYLE one screen down sets the same thing visibly and editably; asking twice costs a tap and buries a duplicate in prose the user cannot edit.
- Interview Q1 (goal) as an open question: confirm the Settings `goal` the coach already receives (L32771, L49045) instead — the north star is fewer screens before a real answer, and this one asks for data the app holds.
