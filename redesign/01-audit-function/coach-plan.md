# Coach Plan — Function Audit (Wave 1)

**Purpose.** Show the multi-week plan the coach wrote — which phase you are in, what this week is for, how far its targets have come — as a read-only document you ask the coach to change.

## How the plan is produced (verified)

Not an endpoint. The prompt (L48892) tells the model to emit the plan between `###PLAN_START###`/`###PLAN_END###` inside a chat reply; `handleReply` finds them by `indexOf` and `JSON.parse`s the slice (L50241-50247); the bubble's **SAVE PLAN** button (L51918-51943) calls `saveCoachPlan` (L50518-50527). Nothing saves automatically. `max_tokens: 1000` (L50067) — a 3-phase plan plus prose sits near that ceiling.

| Malformation | Path | User sees |
|---|---|---|
| `PLAN_END` missing (truncation) | `pe2 = -1`; the generic strip (L50258) needs both markers | raw `###PLAN_START###{…` JSON in the bubble, no card |
| JSON invalid | `catch (e) {}` L50246 | block stripped, no card, no error |
| Reply is only a plan | generic strip runs *before* detection, so `displayTxt` is already `"Done!"` and the `"Here is your plan:"` fallback (L50251) is dead | bubble reads "Done!" |
| Card not tapped | `lk_coachLastMsgs` keeps 40 messages (L49927) | plan lost once it scrolls out |

## Is the plan connected?

No. `coachPlan` is read in five places (grep, whole file): the pane (L50013), `saveCoachPlan` (L50022), the coach context string (L49057-49071, only if `coachDataPrefs.plan`), a chat opener chip (L49320), the beta export (L2817). Train Hub, splits, Home and Workout Log never read it. The JSON carries no days, exercises, sets or loads — only prose, targets and week ranges — so an accepted plan must be rebuilt by hand in Split Builder. The pane's only contact with training is the week-dot row, reading `p.splits[0]` blindly (L51009-51014).

**Editing:** none — `Adjust this plan` (L51201) prefills a chat message; the only write is a whole-plan overwrite from another reply. **Expiry:** none — past the last `weekEnd` the pane shows "This plan has run its course." + a review prefill (L51018-51032); the record persists until delete (`confirm()`, L51222) or overwrite. No archive.

## Feature inventory

| Feature | Line | Status |
|---|---|---|
| Empty state + prefill CTA | L50963-50983 | working |
| THIS WEEK card (phase/week, notes, deload copy) | L51046-51068 | working |
| Week dots vs `splits[0]` day count | L51009-51014 | broken (assumes the first split is the one being run) |
| Overall progress bar | L50727-50734 | broken (inherits target bug) |
| Phase timeline, expand, 7-phase cap | L51114-51199 | working |
| Target rows and % bars | L51172-51190 | broken — shortcut ids (L50577-50588) stale: `bench→107`=*Incline DB Fly*, `deadlift→201`=*Pull Up*, `pull up→207`=*Wide Grip Pulldown* |
| Plan `name` / `description` | stored L50520 | dead — never rendered; used only in prefills |
| Plan-over / phase-ending review | L51018-51032 | working |
| Adjust this plan | L51201-51219 | working, redundant with the empty CTA path |
| Delete this plan | L51220-51236 | working; native `confirm()`, no undo, no archive |
| Header rename / New chat / tabs | L50857-50916 | shared shell; 10x12 rename target |

## Task walkthrough

| Task | Steps | Taps | Evidence |
|---|---|---|---|
| Read this week | Nav Coach → tab Plan | 2 | `coach-plan-populated.png` (index.md L299) |
| Expand a phase | + phase row | 3 | `coach-plan-populated-phase-open.png` |
| Get a plan (no flow spec) | Plan → "Ask the coach for one" → Send → SAVE PLAN → Plan | 6 + round trip | flow-5.json 2401 Send, 2947 reply (795 ms); `coach-plan-empty.png` |
| Act on the plan | rebuild it by hand in Split Builder | unbounded | no reader outside CoachScreen |

Hesitation: SAVE PLAN sits in a scrolling bubble; nothing warns the plan will not change the split.

## State coverage

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `coach-plan-empty.png` | yes — "No plan yet", one CTA | correct |
| Populated | `coach-plan-populated.png` | yes | correct as a state (numbers scored under Data correctness) |
| Loading / Error | — | N/A: pane issues no request, plan is parsed out of a chat reply (page-map 2.14 L/X n/a; index.md L448-449) | — |

A = 2, M = 0, W = 0, G = 0.

## Baseline failures

| Item | Cause |
|---|---|
| Non-responder "Coach name" (SUMMARY L40) | harness artefact: the input is already focused when the crawl clicks it (SUMMARY L124b); shared with the other coach pages. Real defect is the 10x12 target (D12) |
| "Delete this plan" skipped as destructive | native `confirm()` L51222 (D15); `coach-plan-populated-delete-armed.png` is pixel-identical to `-scrolled-2.png` — no in-app confirmation surface |
| 3/17 targets under 44px; axe `meta-viewport` 1(1) | shell-wide (D12, D1) |

## Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 3 | `coach-plan-populated.png`: header reads "Coach · Continuing last conversation", not Plan; job inferable after reading THIS WEEK; 3 primary-weight elements compete (Adjust this plan, mic FAB, New chat) |
| Feature completeness | 2 | Core renders, but target progress is broken and `name`/`description` dead — `coach-plan-populated.png` shows a plan with no title anywhere |
| Task success | 2 | Reading passes (baseline populated + 11/12 interactive); acting on the plan needs a manual rebuild in Split Builder; no flow covers plan creation |
| Speed | 4 | 2 taps to THIS WEEK, 1 screen change (`coach-plan-populated.png` chain); shortfall: creating a plan is 6 taps + a chat round trip (flow-5 795 ms) and the week's assignment appears nowhere on Home or Train |
| State handling | 5 | Band table, A=2, M=W=G=0: `coach-plan-empty.png` (specific, one action), `coach-plan-populated.png`; loading/error N/A per page-map 2.14 |
| Data correctness | 1 | `coach-plan-populated.png`: "Bench 5RM → 75 kg 0%" while seed `lk_prs["111"]`=72.5 kg (97%); "Deadlift 4RM → 120 kg 0%" while `lk_prs["221"]`=115 kg (96%). Cause L50577-50588; propagates to "Phase progress 10%" and "Overall 37%" (true ≈56%) |
| Error recovery | 1 | Silent loss: a truncated or malformed marker drops the plan with no message and no retry; no error surface |

**Function mean 2.6.**

## Keep, fix, cut

**Keep**
- THIS WEEK card as the lead — it answers "what is this week for" (`coach-plan-populated.png`).
- Empty state: 20 words, one action (`coach-plan-empty.png`).
- Phase timeline with "← you are here", the deload explanation, and the phase-ending review prompt (L51018).

**Fix**
- Resolve targets through `EX_NAME_INDEX` (L4766) instead of the stale id map — the 0% bars.
- Render `plan.name` and `plan.description`; the plan is untitled on screen.
- Persist a detected plan on arrival; surface parse failures instead of "Done!".
- Give the plan a writer: phases should emit or bind a split that Train Hub and Workout Log read.
- In-app destructive confirm, an archive of finished plans, 44px rename target, one primary element.

**Cut**
- The `splits[0]` week-dot heuristic — it counts sessions against a split the user may not be running, so it is wrong about their training.
- The dead `"Here is your plan:"` fallback (L50250-50253), unreachable after the generic strip.
- The standalone Plan tab as a destination: a document no other screen reads fails the north star's requirement to tell you what to do next; the week's assignment belongs on Home/Train.
