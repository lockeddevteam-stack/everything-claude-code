### F-PAY-001 — The paywall sheet
- location: `655-847`? — `showPaywall` at `655-843`, `_paywallCard` at `845-855`? (precisely: `showPaywall` 655-840, `_paywallCard` 842-853).
- user action: `window.LOCKED.paywall()`.
- behaviour: 1. If `#locked-paywall` exists it is re-shown (`display:flex`) rather than rebuilt (656-657). 2. A z-10000 full-screen scrim (`rgba(0,0,0,0.72)`, 8px backdrop blur) with a bottom sheet that slides up via a `requestAnimationFrame` transform (659-668, 834-839). Tapping the scrim hides it (829-831). 3. Content: a "PRO FEATURE" pill, "UNLOCK LOCKED PRO" headline, subcopy, a 2-column feature grid of six `_paywallCard(title, desc)` entries, two pricing cards, and the CTA block. 4. Feature cards (698-705): "Unlimited AI Coach / No daily coaching limits"; "Meal Analysis / USDA-accurate nutrition"; "Split Builder / Unlimited AI programs"; "Coach Instructions / Fully personalise your AI"; "Budget Tracking / Grocery & cost analytics"; "Weight Selector / AI-assisted load picking". 5. Pricing: **MONTHLY $6.99/month**; **ANNUAL $60/year** with a "SAVE 28%" badge (708-728). 6. CTA is **not purchasable**: "Available on the App Store Soon — In-app purchase launches with the iOS app. Keep training — your trial data is saved." (731-742), plus a "Continue with free access" button that merely hides the sheet (743-748).
- v6 status: WORKING as a display; **no purchase flow exists anywhere** (no Stripe, no StoreKit, no checkout URL in the file). - **Accessibility**: no `role="dialog"`, no focus trap, no Escape handler; the only close affordances are the scrim tap and the text button.

### F-PAY-002 — Entitlement fetch & the `can()` gate
- location: `343-355` (`fetchSubscription`), `357-372` (`can`), `374-376` (`_LOCKED_usage`).
- user action: 
- behaviour: 1. `fetchSubscription(userId)` — note `userId` is accepted but unused; the call is `GET {WORKER_URL}/user/check` with only `Authorization: Bearer <token>` (344-347). Non-OK returns silently (348). 2. Response shape consumed: `{ subscription, usage, limits }` → `window.LOCKED.subscription`, `.usage`, `.limits` (349-353). Errors are console-warned only (354). 3. `can(feature)`: guests → `true` (358); no subscription → `false` (359); `isPro` → `true` (360); otherwise a literal gate map (361-370): - `coach_chat`: `usage.coachChatsToday < 10` - `meal_analysis`: `usage.mealAnalisesToday < 5` (note the typo `mealAnalises`) - `split_builder`: `usage.splitsThisMonth < 1` - `instructions`: `false` - `budgeting`: `false` - `select_weight`: `false` - unknown feature → `false` (371). 4. `_LOCKED_usage(field)` reads `window.LOCKED.usage[field] || 0` (374-376).
- v6 status: **DEAD CODE.** `LOCKED.can` is exported (1157) but **never called anywhere in the file** — `rg 'LOCKED\.can\(|\.can\("'` returns zero hits. `window.LOCKED.isPro` (1148) likewise has no call sites. `_subscription.isPro` is read only inside the module (360, 1148).

### F-PAY-003 — Actual runtime gating — server-side 429 / `gated`
- location: `2679-2686` (`aiCall` gated branch), `50075` and `50088-50098` (coach chat 429), `51374-51384` (the paywall CTA).
- user action: 
- behaviour: 1. Enforcement happens **on the worker**. `aiCall` inspects `d.gated` on the JSON response and, when true, toasts `d.content[0].text` or "Daily limit reached. Upgrade to Pro for unlimited access." and calls `onFail` (2681-2686). 2. The coach chat maps HTTP `429` to `{kind:"limit"}` (50075) and renders the message "You've used your 10 free chats today. Resets at midnight." (50088) with an action button labelled "See plans" that calls `window.LOCKED.paywall()` (51376, 51384). 3. This is the **only** place in the app that opens the paywall besides the trial banner's UPGRADE TO PRO button (648).
- v6 status: WORKING. Server limits UNVERIFIED (no worker source).

### F-PAY-004 — Trial banner
- location: `628-653` (`checkTrialWarning`).
- user action: 
- behaviour: only when `_subscription.status === "trial"` and `daysLeft <= 4` (629-630); idempotent via `#locked-trial-banner` (631-632). Renders a fixed top banner in `--color-accent-deep` reading "Trial ends in N day(s)" or "Your trial has expired" when `daysLeft <= 0` (644-646), with an "UPGRADE TO PRO" button calling `LOCKED.paywall()` and a 44×44 "×" dismiss button (648-651). Prepended to `document.body` (652). Called after session restore (309), after sign-in (405), and after signup (1057).
- v6 status: WORKING. Trial length (14 days per the copy at 847 and 1058) and `daysLeft` originate on the server — UNVERIFIED. ---
