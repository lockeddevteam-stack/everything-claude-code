# Wave 1 shared brief: Function Audit

You audit ONE page. Write only `01-audit-function/<slug>.md`. Do not edit any other file.

## Read first
- `directive.md` (North Star, the 11-item checklist, Scope table, Wave 1)
- `00-inventory/rubric.md` (Function rubric; the rulings and band tables are binding)
- `00-inventory/calibration.md` (standing rules for scoring; read the last section carefully)
- `00-inventory/page-map.md` (your page's row: components, entry and exit, states, data)
- `00-inventory/user-flows.md` (every flow that touches your page)
- `00-inventory/screenshots/index.md` (what each capture shows and how it was reached)
- `tests/baseline/SUMMARY.md` and `tests/baseline/page-metrics.jsonl` and `flow-metrics.jsonl` (your page's rows)

## Evidence rules
- Screenshots are ground truth. Scoring from code alone is invalid and fails the gate. Every evidence cell names a capture in `00-inventory/screenshots/current/`.
- View the PNGs with the Read tool. Flow videos have step logs (`flow-<n>.json`) giving timestamp and selector per step; cite timestamps.
- Source line refs from `input/locked-current-v6.html` support a claim, they do not replace a capture.
- A state counts as present only if it renders something distinguishable from the populated screen. A code branch is not evidence.
- If you measure something yourself, say how. Playwright lives at `tests/node_modules`, fixtures at `tests/fixtures/index.mjs`, app at http://127.0.0.1:4173/tests/app/index.html (start with `cd redesign && nohup node tests/serve.mjs 4173 &` if curl gets nothing).

## Required sections
1. **Purpose**, one sentence.
2. **Feature inventory**: table of every feature with component and line, and a mark of dead, broken, redundant, hidden, or working. Dead means unreachable from the UI. Broken means it errors or produces a wrong result. Redundant means another surface does the same job. Hidden means it works but no reasonable user would find it.
3. **Task walkthrough**: per flow touching this page, the steps, tap count, elapsed ms from `flow-metrics.jsonl`, video timestamp, and where the user would hesitate.
4. **State coverage**: empty, loading, error, populated. Capture name per state, present or missing by the visual test, and whether the content is correct, generic, or wrong.
5. **Baseline failures**: every failure and non-responder for this page from the baseline results, each with its cause traced to a line.
6. **Rubric scores**: the 7 Function criteria as rows criterion | score | evidence. Follow the band tables exactly.
7. **Keep, fix, cut**: three lists. Every entry one line, with the evidence that justifies it. "Cut" needs a reason tied to the north star: what job it fails to do.

## Cap
1,200 words including tables. Exceeding the cap fails the gate. Write dense, drop adjectives.
