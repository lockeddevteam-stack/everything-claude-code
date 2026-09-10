# LOCKED redesign — browser-driven bug review

Target: `/home/user/everything-claude-code/redesign/08-build/` (13 screens + `tokens.css`,
`components.css`, `app.js`, `chrome.js`, `bodymap.js`), opened from `file://` in
Chromium via Playwright 1.56.1 at 402x874 (and 320x844 for the overflow pass).

Harness scripts (all under `/home/user/everything-claude-code/redesign/tests/`):

| script | what it does |
|---|---|
| `agent-bug-recon.mjs` | loads every screen, dumps dev states + testids + load errors |
| `agent-bug-states.mjs` | cycles every `.dev__item` state, checks errors / bad text / empty lists / overflow / dev aria |
| `agent-bug-clicks.mjs` | **main sweep** — for every dev state x every visible `[data-testid]` control: fresh load, set state, click, then diff DOM, URL, focus, aria, overflow, bad text, and test Escape/scrim/close on anything that opened |
| `agent-bug-typing.mjs` | types into every visible input/textarea in every state; checks value, focus and caret survive the re-render |
| `agent-bug-overflow2.mjs` | every screen x state at 320px and 402px; document overflow + any element escaping the `.screen` box |
| `agent-bug-axe.mjs`, `agent-bug-axe1.mjs` | axe-core violations per screen/state |
| `agent-bug-blocked.mjs`, `agent-bug-noop.mjs` | triage passes over the sweep's CLICK-BLOCKED / NO-OP hits |
| `agent-bug-splitname.mjs`, `agent-bug-tabbar.mjs`, `agent-bug-occl.mjs`, `agent-bug-focus*.mjs`, `agent-bug-padscrim.mjs`, `agent-bug-exdays.mjs`, `agent-bug-bodymap.mjs` | isolated reproductions of the findings below |

Raw sweep output: `agent-bug-clicks.json` (~1,100 raw hits before triage),
`agent-bug-clicks.progress`, `agent-bug-typing.log`, `agent-bug-blocked.log`,
`agent-bug-noop.log`.

