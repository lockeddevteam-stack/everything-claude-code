# Calibration (0G)

Two agents scored Workout Log and Settings independently, from the same evidence, without reading each other's file. Per-round detail is in `calibration-A.md` and `calibration-B.md`. Anchor edits are in `rubric.md` section 6.

Convergence rule: every criterion within 1 on both pages, and no checklist item split pass/fail.

## Rounds

| Round | Criteria returned to 0F | Result |
|---|---|---|
| 1 | Motion and feedback; checklist 4, 5, 6, 10; plus 8 ambiguity rulings raised by both scorers | 1 criterion still at delta 2 |
| 2 | State handling (presence definition) | 1 criterion still at delta 2 |
| 3 | none | converged |

## Round 3 final scores

| Criterion | Workout Log A | Workout Log B | Δ | Settings A | Settings B | Δ |
|---|---|---|---|---|---|---|
| Purpose clarity | 4 | 3 | 1 | 3 | 4 | 1 |
| Feature completeness | 3 | 4 | 1 | 3 | 3 | 0 |
| Task success | 3 | 3 | 0 | 5 | 4 | 1 |
| Speed | 1 | 1 | 0 | 5 | 5 | 0 |
| State handling | 5 | 4 | 1 | 1 | 1 | 0 |
| Data correctness | 1 | 1 | 0 | 1 | 1 | 0 |
| Error recovery | 4 | 4 | 0 | 2 | 2 | 0 |
| Hierarchy | 2 | 3 | 1 | 1 | 2 | 1 |
| Typography | 3 | 2 | 1 | 3 | 3 | 0 |
| Spacing | 3 | 3 | 0 | 3 | 3 | 0 |
| Contrast | 5 | 5 | 0 | 5 | 5 | 0 |
| Component consistency | 2 | 2 | 0 | 1 | 1 | 0 |
| Targets | 1 | 1 | 0 | 1 | 1 | 0 |
| Motion and feedback | 4 | 4 | 0 | 5 | 5 | 0 |
| HIG fit | 1 | 1 | 0 | 1 | 1 | 0 |
| AI-look penalty | 2 | 2 | 0 | 1 | 1 | 0 |
| Accessibility | 3 | 3 | 0 | 3 | 3 | 0 |

Maximum delta 1 on every criterion, both pages. Checklist: both scorers pass items 4 and 11 on Workout Log and items 4 and 5 on Settings, 2/11 each, same items. Converged.

Means: Workout Log Function 3.0 / 2.9, Design 2.6 / 2.6. Settings Function 2.9 / 2.9, Design 2.4 / 2.5.

## What the rounds actually fixed

Every delta of 2 or more traced to an unstated measurement method, not to differing judgment. Three cases:

1. **Pressed state.** A dispatched a synthetic `pointerdown` and read computed style at 50ms, finding no change; B used a real `mouse.down`. A synthetic pointer event never triggers `:active`, so A measured nothing. The anchors now name the press method, the sample (primary action plus four controls), and the 100ms read.

2. **Spacing percentage.** A counted zero-valued padding longhands as on-grid, reaching 96%; B excluded them, reaching 83%. The anchors now fix the denominator to non-zero longhands over the full page, excluding tab bar and floating button.

3. **State presence.** A called the Settings loading state missing because nothing visible changes; B called it present because the code branches. The anchors never said which. The round-3 ruling makes presence visual, settled by a screenshot diff against a matched populated capture and then by naming a distinguishing element, with a band table mapping counts of missing, present-but-wrong, and generic states to one score.

Two round-1 measurements were also wrong in ways both scorers later corrected themselves: distinct font sizes counted tab bar and floating button nodes that belong to the shell rather than the page, and a white-on-black contrast hit on the Finish button was a false positive because that button paints its own background.

## Evidence defect found during calibration

Both scorers independently reported that `settings-loading.png` and `settings-error.png` are pixel-identical at the diff threshold and clipped just below the beta code input, so neither the pending indicator nor the message line is inside the frame. `settings-loading.png` is also captured at a different scroll offset than `settings-populated.png`, making any diff between them scroll-confounded.

The Settings score is stable either way. Reading the error as present-but-wrong gives M=1, W=1; reading it as also missing gives M=2, W=0; the band table returns 1 for both. The captures were re-taken with a matched control frame so later auditors are not left with the same ambiguity. See the Capture corrections section of `screenshots/index.md`.

## Standing rules for Waves 1 and 2

- A state counts as present only if it renders something distinguishable from the populated screen. A code branch is not evidence.
- Pressed-state measurement uses a real mouse press and a 100ms read, never a dispatched event.
- Spacing percentages exclude zero values and shell chrome.
- A loading or error capture is only comparable against a populated capture at the same theme, scroll offset and sheet state.
- Scores citing code alone are invalid. Every evidence cell names a screenshot.
