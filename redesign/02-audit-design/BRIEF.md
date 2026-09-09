# Wave 2 shared brief: Design Audit

You audit ONE page. Write only `02-audit-design/<slug>.md` and `02-audit-design/<slug>-annotated.png`. Do not edit any other file.

## Order of work, this matters
Write your rubric scores and checklist verdicts BEFORE you open `01-audit-function/<slug>.md`. That file exists and covers the same page from the function side. Reading it first contaminates an independent second opinion. After your scores are written, you may read it, and if it changes your mind, say so explicitly in a short "After reading the function audit" section rather than silently editing a score.

## Read first
- `directive.md` (North Star, the 11-item checklist, the sprawl table)
- `00-inventory/rubric.md` (Design rubric; the round-2 and round-3 rulings and band tables are binding, not advisory)
- `00-inventory/calibration.md` (standing rules; the last section is the short version)
- `00-inventory/design-system-current.md` (what the app's system actually is, measured)
- `00-inventory/screenshots/index.md` (what each capture shows, how it was reached, and the Capture corrections section)

## Measurement, not impression
Every number you cite must be measured by you or read from `tests/baseline/` (`targets.json`, `contrast.json`, `axe.json`, `scans/<slug>.json`). Playwright is at `tests/node_modules`, fixtures at `tests/fixtures/index.mjs`, app at http://127.0.0.1:4173/tests/app/index.html (start with `cd redesign && nohup node tests/serve.mjs 4173 &` if curl gets nothing).

Binding methods from calibration:
- Pressed state: real `page.mouse.down()`, read computed transform, background-color, opacity and box-shadow at 100ms. A dispatched event never triggers `:active` and will tell you nothing.
- Spacing: non-zero padding, gap and margin longhands over the full page, excluding tab bar and floating button. Zero values are not on-grid.
- Typography: distinct computed font-size on visible non-empty text nodes, half-pixels distinct.
- A state counts as present only if it renders something distinguishable from the populated screen.
- Contrast over gradients or images is unknown, not passing. Say so.

## Required sections
1. **Squint test** (8px blur on the populated capture) and **5-second test**: what a person sees first, second, third, and what they think the page is for. Name the element that wins.
2. **Numbered callouts** keyed to your annotated PNG.
3. **Measurements**: contrast per distinct text style; target size per interactive control with pass or fail at 44x44; spacing deltas from the 8px grid with the percentage on grid; distinct type sizes and weights.
4. **Rubric scores**: the 10 Design criteria as rows criterion | score | evidence. Follow the band tables exactly.
5. **Detail checklist**: all 11 items, pass or fail, each with the measurement that settles it.
6. **Consistency deltas**: where this page departs from the app's own current system (radii, tab pattern, card style, icon size, accent use), measured against `design-system-current.md`.
7. **Keep, fix, cut**, one line each with evidence.

## Annotated image
Produce `<slug>-annotated.png`: the populated capture with numbered markers matching your callouts. Pillow is installed (`from PIL import Image, ImageDraw, ImageFont`). Draw filled circles with numbers and a short legend. Keep it legible at 1x.

## Cap
1,200 words including tables. Exceeding the cap fails the gate.
