# Design Audit: Coach Chat (`coach-chat`)

Evidence: `screenshots/current/coach-chat-*.png`, `baseline/scans/coach-chat.json`, live measurement at 393x852 dark.

## 1. Squint and 5-second test

8px blur of `coach-chat-populated.png`: first the **voice FAB** (bottom right), second the **coach logo tile** (top left), third the pale composer slab. Send vanishes (grey, 0.4 opacity). **The winner is the floating voice button — not this page's primary action, and not owned by this page.**

5 seconds: "a coach thing with four tabs and a message box." The conversation reads as unformatted body copy because only user turns are bubbles. Purpose is inferable; the primary action is not.

## 2. Callouts
Legend printed on `coach-chat-annotated.png`: (1) 195px header stack, (2) 10x12 rename, (3) one-sided bubbles, no timestamps, (4) `Edit · re-runs` per turn, (5) unstyled replies, (6) Copy/Retry 36x32, (7) FAB over SAVE PLAN, (8) Send inert until typed, (9) composer.

## 3. Measurements

**Contrast** (scan: 20 nodes, 0 failures, 1 unknown)

| Style | fg / bg | ratio |
|---|---|---|
| 32/800 title | `#F5F5F7` / `#0D0D0F` | 17.8 |
| 12/400 subtitle + tabs | `#A1A1AA` / `#0D0D0F` | 7.6 |
| 12/700 active tab | `#FB923C` / `#1C1C1E` | 7.5 |
| 16/400 bubble text | `#F5F5F7` / accent 11.8% on black | 17.3 |
| 16/400 reply text | `#F5F5F7` / `#000` | 18.7 |
| 11/600 Edit, Copy, Retry | `#A1A1AA` / `#000` | 8.2 |
| emoji on gradient FAB | — | **unknown** |
| bubble border | `rgba(249,115,22,.19)` / `#000` | **1.24, fails 3:1** |

**Targets** (scan, 18 interactive): 7 under 44x44 = **61% pass** — `✎` 10x12; New chat 79x32; Edit 130x32 (x2); Copy 36x32 (x2); Retry 36x32. Empty adds six 28x28 chip `×`. Pass: tabs 83x48, textarea 307x50, Send 46x46, FAB 50x50.

**Spacing**: 99 non-zero longhands (nav and FAB excluded); 71 in {4,8,12,16,24,32} = **71.7% on grid**. Off-grid: 58, 20x3, 10x4, 7x2, 6x10, 2x8, undocumented.

**Type**: populated 4 sizes (11/12/16/32), weights 400–800; empty adds 13/14/17 → **7 across states**. `line-height:normal` on 10 of 18 nodes. Zero `tabular-nums`.

**Other**: header takes 195 of 852 css px (23%) before the first message. No horizontal overflow. Thread pinned to bottom on entry (scrollTop 184 = max). Enter sends; textarea grows 48→120px. The FAB (50x50, `linear-gradient(135deg,#C2410C,#9A3412)`, glow `rgba(249,115,22,.25) 0 2px 6px` + `.22 0 8px 22px`) **overlaps SAVE PLAN in a plan reply by 37x21px = 7% of that 335x31 button**, painting above it.

## 4. Rubric scores (Design)

| criterion | score | evidence |
|---|---|---|
| Hierarchy | 2 | 8px-blur squint winner is the voice FAB, second the logo tile; Send is `opacity 0.4` grey until typed. Two accent-filled elements, neither primary. `coach-chat-populated.png` |
| Typography | 3 | 4 sizes populated / 7 across states; `line-height:normal` on 10/18 nodes; 700 on a 12px tab label. `coach-chat-populated.png`, `coach-chat-empty-full.png` |
| Spacing | 2 | 71/99 non-zero longhands on grid = 71.7%, band 60–79%. `coach-chat-populated.png` |
| Contrast | 4 | 20/20 text nodes pass; 1 unknown (emoji over gradient FAB); bubble border 1.24:1 fails the 3:1 boundary rule. `coach-chat-populated.png` |
| Component consistency | 2 | Two variants of one component: user turn = 16px bubble, assistant turn = transparent, 0 radius, full-bleed. Radii 8/10/12/14/16 over six element types. `coach-chat-populated.png` |
| Targets | 1 | 7/18 under 44 = 61% pass, below 75%. `scans/coach-chat.json`; `coach-chat-populated.png` |
| Motion and feedback | 4 | Real `mouse.down` at 100ms: Send, Chat tab, New chat, Copy, FAB all changed (scale 0.97/1.08 or shadow) = 5/5. −1: `pillIn` 0.35s load-in, and appended messages do not animate. `coach-chat-populated-typed.png` |
| HIG fit | 2 | Two sections violated: Layout (7 controls under 44) and Buttons (primary rendered as a disabled grey control; 36x32 text buttons). `coach-chat-populated.png` |
| AI-look penalty | 1 | 4 tells: emoji as icon (🎙️, `✎`); decorative gradient + accent glow on FAB and logo tile; mixed radii; template copy "Ask me anything about your training". `coach-chat-populated.png`, `coach-chat-empty-full.png` |
| Accessibility | 3 | axe: 1 critical `meta-viewport` (global shell) → capped at 3. All 18 controls labelled; focus order matches reading order; 120% untested. `scans/coach-chat.json` |

**Design mean 2.4.**

## 5. Detail checklist — 1/11

| # | Item | Verdict | Measurement |
|---|---|---|---|
| 1 | Primary action | **fail** | Squint winner is the FAB; Send is opacity 0.4 |
| 2 | Type scale | **fail** | 7 sizes across states; `line-height:normal` on 10/18 nodes |
| 3 | 8px grid | **fail** | 71.7%; breaks (58, 20, 10, 7, 6, 2) undocumented |
| 4 | Control states | **pass** | 5/5 changed at 100ms under real press; `button:disabled{opacity:.4}` exists, Send uses it |
| 5 | Meaningful motion | **fail** | `pillIn` 0.35s load-in; the message list grows with no insertion animation |
| 6 | Empty/error copy | **fail** | Empty (`coach-chat-empty-full.png`): headline + 6 chips + 6 dismiss × + disclosure + disclaimer = 13 controls, over 2 lines and one action. Error is correct with Retry; fails on empty |
| 7 | Numbers | **fail** | Zero `tabular-nums`; "72.5 kg", "87.5 kg" proportional; no timestamp on any turn |
| 8 | One icon set | **fail** | 🎙️ FAB and `✎` rename beside 1.8-stroke `Ic` SVGs |
| 9 | Scroll and targets | **fail** | No horizontal overflow, but 7 targets under 44 |
| 10 | Native dark | **fail** | L* rises 0 → 3.7 → 5.3 → 10.3, but the FAB carries two accent glow shadows |
| 11 | Copy | **fail** | "Edit · re-runs from here" is 5 words on a button; no exclamations |

## 6. Consistency deltas vs `design-system-current.md`

- **Radii**: 8 (New chat), 10, 12 (tabs), 14 (Send, FAB), 16 (bubble, textarea) — five values, six element types.
- **Tab pattern**: a filled 12px-radius pill on a transparent 83x48 track — a third pattern beside flat nav items and `DsSegmented`.
- **Card style**: the app card is `--color-card #1C1C1E` at 16px; the assistant reply is transparent at 0 radius, so the densest content is the one thing that is not a card — while the plan card inside a reply is.
- **Icons**: `Ic` defaults z=20 / stroke 1.8; here a 20px emoji and a 12px text glyph.
- **Accent**: four accent surfaces at once (logo gradient, active tab, bubble fill, FAB); none is the primary action.

## 7. Keep, fix, cut

- **Keep**: composer behaviour — Enter sends, textarea grows 48→120px, thread pinned to bottom on entry, Send `disabled` on empty.
- **Keep**: error state — "The coach is down. Not your fault." with Retry (`coach-chat-error.png`).
- **Fix**: make Send the one accent-filled control; it is invisible at 8px blur while the FAB wins.
- **Fix**: give replies a real surface (`--color-card`, 16px) so both speakers are one component in two states.
- **Fix**: 7 targets under 44; the 10x12 rename and 36x32 Copy/Retry are worst.
- **Fix**: add a timestamp per turn or day group; the thread carries no time information.
- **Cut**: the voice FAB here — it wins the squint, is an emoji on a glowing gradient, and covers 37x21px of SAVE PLAN.
- **Cut**: `Edit · re-runs from here` per turn; at 130x32 it out-shouts the reply above it.
