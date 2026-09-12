# Build rules — fixing the sign-off findings

You are fixing one screen. Another agent is fixing each of the others at the
same time, so the first rule is about staying inside your own file.

## 1. Your files, and nobody else's

Edit only the files you were given. Do not touch any other screen, and do not
touch the shared modules (`app.js`, `chrome.js`, `theme.js`, `session.js`,
`fixtures.js`, `store.js`, `units.js`, `tokens.css`) — if you need something
from one, read it and use it. If you genuinely need a change there, say so in
your report instead of making it.

**`components.css` is shared.** If you need a class, add it at the END of the
file, in one block, under a comment naming your screen. Never edit an existing
rule.

## 2. Order of work

**Defects first.** A screen that lies is worse than a screen that lacks a
feature. Work in this order:

1. **Anything that says something untrue.** Copy claiming a thing happened
   that did not. Fix the behaviour where you can; where you cannot, fix the
   sentence. Never leave a claim the build cannot back.
2. **Any figure that cannot be reproduced from `tests/fixtures/seed-data.json`.**
   Recompute it from the seed and make the screen agree. If two screens
   disagree, the seed decides.
3. **Any control that does nothing.** Wire it, or remove it. An inert control
   is a defect whichever way it is fixed.
4. **Persistence** — see rule 3.
5. **Then the missing features**, largest first.

## 3. Persistence: `window.LKStore`

Nothing in this build survived a reload. `store.js` fixes that and your screen
must use it.

```js
LKStore.get(key, fallback)   // stored value, else the fixture's, else fallback
LKStore.set(key, value)      // writes, notifies this page and other tabs
LKStore.patch(key, obj)      // merge into an object key
LKStore.push(key, item)      // prepend to an array key
LKStore.touched(key)         // has a person written this, or is it still seed?
LKStore.onChange(key, fn)    // fn(value, key)
LKStore.remove(key) / .reset() / .dump() / .load(obj)
```

- **The fixture is the seed, the store is the truth.** Read through
  `LKStore.get` so a screen opens populated for a new reader and remembers
  what an existing one did.
- **Use the shipped app's key names** (`lk_history`, `lk_goals`,
  `lk_supplements`, …). They are listed in `tests/fixtures/seed-data.json`.
- **Write on the action, not on a Save button somewhere else.** If ticking a
  set is the commitment, that is where the write goes.
- **The dev-state switcher must not read storage back over the state it is
  showing.** Pass a flag through your reset/apply function the way `coach.html`
  does.

## 4. Units, theme, session

- Every weight goes through `LKUnits` (`.v()`, `.fmt()`, `.fmtTotal()`,
  `.label()`). Never print a bare `' kg'`.
- The model is always kilograms. Convert on the way out, never on the way in.
- `LKTheme` and `LKSession` already work; use them rather than duplicating.

## 5. What to do about things that need a server

This build has no server and no network. For a feature that needs one:

- Build **the whole local half** — the form, the validation, the state, the
  arithmetic you can actually do on the device.
- Have the screen **say plainly** what the remaining half needs, in its own
  voice, at the point of use. "Not in this build. Nothing has left this
  device." is honest. A toast that reads as success is not.
- Never fabricate a result and present it as measured. If a figure would come
  from a model, label it as generated, or do not show it.

## 6. House style

Read the file before you write in it and match what is there.

- **Comments say why, not what.** The convention in this build is to name the
  defect the code is answering: what the screen used to do, why that was
  wrong, and what it does now. Write in full sentences. Do not write a comment
  that only restates the line under it.
- Vanilla ES5-flavoured JS, `var`, no build step, no framework, no CDN.
- Every control needs a `data-testid`, a real `<button>` where it acts like
  one, and an accessible name.
- Re-render through `LKPatch`, never `innerHTML` on a live region.
- No em dashes in user-facing copy.

## 7. Prove it before you finish

1. `node -e` parse-check every file you touched.
2. Drive it in Playwright (1.56.1, in `redesign/tests/node_modules`, Chromium
   at `/opt/pw-browsers` — **never run `playwright install`**). Scripts must
   live in `redesign/tests/`, named `zz-<yourscreen>-*.mjs`, and must be
   **deleted before you finish**.
3. Check the console is clean: zero page errors on load and on every path you
   touched.
4. Reload and confirm what you persisted is still there.
5. Recompute at least three figures from the seed by hand and confirm the
   screen agrees.

## 8. Your report

- What you fixed, grouped by the three defect classes above.
- What you built, by feature id.
- What you could not do, and precisely why.
- Anything you found that was not in your list.

Be exact. No preamble.
