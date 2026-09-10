# Component map — the Apple pass target

Eleven screens, two shared stylesheets, three shared scripts. Not the live
app: this is the redesign build in `08-build/`, assembled into
`10-final/locked-demo.html`.

| Screen | Lines | Handlers | Buttons | Inputs | testids | States |
|---|---|---|---|---|---|---|
| `coach.html` | 1382 | 59 | 51 | 3 | 90 | bodyfat, brief, chat, checkins, coach, direct, encouraging, fuel, goals, home, nutrition, plan, progress, prs, setup, supplements, technical, train, training, weight |
| `exercise-library.html` | 1159 | 35 | 31 | 4 | 50 | abs, add-day, add-workout, adduc, all, back, biceps, bw, calves, chest, custom, forearms, front, glutes, hams, lateral, lats, long, lower, lowerback, medial, mid, midback, quads, rear, short, shoulders, side, start, traps, triceps, upper, weighted |
| `home.html` | 412 | 2 | 16 | 0 | 19 | empty, error, loading, rest, training |
| `mockup-bodymap.html` | 676 | 5 | 5 | 1 | 2 | — |
| `onboarding.html` | 1116 | 10 | 31 | 5 | 65 | — |
| `progress.html` | 737 | 17 | 18 | 0 | 37 | empty, error, loading, populated |
| `review.html` | 961 | 4 | 23 | 0 | 45 | diff-add-skip, diff-many, diff-skip, diff-swap, diff-updated, easy, empty, error, hard, loading, max, populated, record, steady |
| `settings.html` | 961 | 25 | 23 | 4 | 30 | error, guest, loading, signed-in, signed-out |
| `split-builder.html` | 1107 | 48 | 36 | 4 | 68 | — |
| `train.html` | 865 | 25 | 26 | 1 | 46 | all, cardio, empty, error, lift, loading, populated |
| `workout-log.html` | 1064 | 65 | 49 | 5 | 91 | empty, error, exercise-done, first-set, keypad, loading, mid-session, plates, rest |
| **total** | **10440** | **295** | **309** | **27** | **543** | |

## Shared layer

- `tokens.css` — 565 lines, 15 rules, 82 custom properties
- `components.css` — 1485 lines, 416 rules, 0 custom properties
- `app.js` — 457 lines
- `bodymap.js` — 394 lines
- `theme.js` — 67 lines
- `vendor/body-art.js` — 43 lines
