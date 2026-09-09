# Function audit — coach-chat (CoachScreen L49915, `coachTab=="chat"`)

**Scope.** Chat pane (L51237-L52160), its header and the pane bar (L50912) only as an exit. Plan (L50957), Setup/Interview (L49483/L49750), Check-In (L52547) belong to the other two audits; the plan **card inside a reply** (L50518) is scored here because the write happens here.

## 1. Purpose
Coach Chat is where a lifter asks an AI coach about their own logged numbers and gets an answer that can be written into the app as a plan, split, goal, food or cardio entry.

## 2. Feature inventory

| Feature | Line | Status | Evidence |
|---|---|---|---|
| Send message → reply | 52153 / 50330 | working | flow-5 pass, 2 taps 795 ms; `coach-chat-populated-reply.png` |
| Typing indicator + Stop the reply | 52031 | working | `coach-chat-loading.png` |
| Error bubble + Retry | 50098 | working | `coach-chat-error.png` |
| 429 limit bubble + "See plans" → paywall | 50075-50087 / 51376 | **broken** | probe: 429 in guest → "10 free chats today" + paywall `display:flex` while subscription is `{guest, isPro:true}` (L333). §5 |
| Reply → SAVE PLAN writes `lk_coachPlan` | 50241 / 50518 | working | probe below: card rendered, `lk_coachPlan` byte-identical to fixture |
| Reply → split / goal / food / cardio / recipe / shopping / instructions cards | 50152-50305 | hidden | no capture shows one; same parser as the plan card |
| Auto-saved memory chip (`###REMEMBER###`) | 50287 | hidden | no capture; writes `coachMemory` with no tap |
| Edit message, re-runs from here | 50126 | working | `coach-chat-populated.png`; baseline responded |
| Copy this reply | 51400 | working | baseline `interactive` responded |
| New chat (two-tap arm) | 49940 | working | `coach-chat-populated-new-chat-confirm.png` |
| 6 suggestion chips + dismiss × | 51271 | working | `coach-chat-empty-full.png`; baseline chip responded |
| Data receipt "can see 11 things about you" → Change what it sees | 51301 | hidden | `coach-chat-empty-full.png`; renders only when `msgs.length===0`, gone after the first message |
| Data-driven opener line | 51262 | working, clipped | `coach-chat-empty.png`: headline cut by the header; scroller measured at `scrollTop 41` on mount |
| Rename coach (pencil) | 49962 | working | `coach-chat-populated.png`; hit box 10x12 (D12) |
| Pane bar (4 tabs) | 50912 | working | `coach-chat-populated-checkin.png` |
| "Jump to latest" | 52071 | hidden | absent from all 10 captures |
| "Earlier messages trimmed" at 40 msgs | 51325 | hidden | absent from all captures |
| Voice FAB | shell | redundant | overlaps SAVE PLAN in my probe capture; duplicates the input |

## 3. Task walkthrough

**Flow 5 — send one message, receive a reply.** Nav "Coach" (tap 1) → type into `Ask your coach` (0 taps) → Send (tap 2) → user bubble, dots, reply. **2 taps, expected 2, 795 ms** (`flow-metrics.jsonl` line 6, pass). Video `flow-5-coach-message-reply.webm`: 1442 Nav, 1983 type, 2401 Send, 2947 reply, 3462 assertion; no screen change. Hesitation: the empty state opens mid-scroll with the opener clipped (`coach-chat-empty.png`), so the first line read is half a sentence; six equal chips plus a free field give no default.

**Measured extension (mine).** Playwright, `lk_coachPlan` removed, fixture routing: Nav Coach → type "plan my week" → Send → reply carries a plan card → **SAVE PLAN** → `lk_coachPlan` written with the fixture's phases → Plan tab renders it. 3 taps, 3.48 s. The coach does act on the app; the fixture only supplies the marker text (`###PLAN_START###`, reply 4) the real worker would emit.

## 4. State coverage (A = 4)

| State | Capture | Present | Quality |
|---|---|---|---|
| Empty | `coach-chat-empty.png`, `-empty-full.png` | yes — opener, chips, receipt, none in populated | correct; opener clipped at mount |
| Loading | `coach-chat-loading.png` | yes — dots + Send swapped to a red stop square (2b, absent from populated) | **generic**: dots only |
| Error | `coach-chat-error.png` | yes — red bubble + Retry | correct for the induced cause (POST aborted → `kind:"server"` L50084); question kept |
| Populated | `coach-chat-populated.png` | yes | correct; matches seed verbatim |

M=0, W=0, G=1 → band 4.

## 5. Baseline failures and non-responders
- `page-metrics.jsonl` line 7: populated, empty, error pass; 0 errors; **1 non-responder, "Coach name"** — the rename input (L49962), already focused when the crawl clicks it, so nothing changes. Harness artifact (`SUMMARY.md` note b); it repeats on coach-plan and coach-setup because all three share the CoachScreen header. The real defect there is the 10x12 hit box (D12).
- `New chat` overlay recorded `closedBy:"unresolved"`: the arm toast (L49940) has no dismiss, it times out.
- **Guest limit (not in baseline, measured here).** Guests are `isPro:true` (L333), send no token (`authHeaders` L2652), and see no chat counter. The worker decides quota; on 429 the app hard-codes "10 free chats today" (L50087) whatever the server rule, and offers "See plans" → `showPaywall` (L51376), contradicting L331 "Guests get full access — no gates, no paywall". A guest is stopped by a limit the UI never counted, exit being a paywall for an account they do not have.

## 6. Rubric scores

| Criterion | Score | Evidence |
|---|---|---|
| Purpose clarity | 4 | `coach-chat-populated.png`: title "Coach", one input, one Send; shortfall: 4 panes + New chat compete in the header |
| Feature completeness | 3 | §2: send/reply/retry work; "See plans" wrong for a guest (probe); receipt and Jump-to-latest hidden; voice FAB overlaps SAVE PLAN |
| Task success | 4 | flow-5 pass 2/2 taps, 795 ms; plan save verified end-to-end (probe); shortfall: the 429 branch dead-ends a guest at a paywall |
| Speed | 5 | `flow-metrics.jsonl` taps 2 = expectedTaps 2, best-known; zero screen changes (`flow-5.json` 2401→2947) |
| State handling | 4 | §4: M=0 W=0 G=1 (bare dots, `coach-chat-loading.png`) |
| Data correctness | 4 | 3 checks: seeded `lk_coachLastMsgs` verbatim incl. "60 → 72.5 kg" (`coach-chat-populated.png`); kg throughout; saved plan equals the fixture JSON (probe) — shortfall: one-week phase prints "Wk 5-5" |
| Error recovery | 4 | `coach-chat-error.png` names the cause, keeps the question, offers Retry; shortfall: the limit variant offers a paywall a guest cannot use |

**Function mean 4.0.**

## 7. Keep, fix, cut

**Keep**
- Send → reply at 2 taps, no screen change (flow-5, 795 ms).
- Reply-to-action cards: SAVE PLAN writes `lk_coachPlan` (probe) — the only thing separating the coach from a chat toy.
- Error bubble naming the cause, question kept (`coach-chat-error.png`).
- Edit-and-re-run and per-message Copy (baseline).

**Fix**
- Guest limit: count chats client-side or drop the "10 free chats" claim; no paywall for `isPro:true` guests (L333 vs L51376).
- Empty-chat auto-scroll clips the opener (scrollTop 41) — pin to top when `msgs.length===0`.
- Data receipt is empty-state-only (L51255); make it reopenable mid-conversation.
- Rename pencil 10x12 (D12) → 44 px.
- Loading is bare dots; say what is being read.

**Cut**
- Four of the six chips and every dismiss × (`coach-chat-empty-full.png`): a chip the user must curate does not get them to the next set.
- "Jump to latest" and the 40-message trim notice: invisible in every capture, so they do no job.
- Voice FAB here: the input takes the same words and the FAB covers the coach's primary action.
