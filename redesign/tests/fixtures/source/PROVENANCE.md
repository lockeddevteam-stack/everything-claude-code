# Where the exercise catalogue comes from

`all-exercises.json` is the delivery this app's catalogue is built from: 886
exercises across 17 primary muscles.

**Licence.** The base layer, 876 exercises, is
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under
the Unlicense. Public domain, commercial use allowed, no attribution required.
The remaining 10 exercises and 26 cue overlays come from a research pass on two
named creators and carry their attribution in `creator_notes`. Nothing here is
taken from Strong, Hevy, Fitbod, JEFIT or StrengthLog.

**How the app's catalogue is generated.**

    node redesign/tests/fixtures/gen-exercise-db.mjs \
      redesign/tests/fixtures/source/all-exercises.json

That writes `tests/fixtures/exercise-db.json` and rewrites the inline
`FALLBACK` array in `08-build/exercise-library.html`, which is the only
catalogue the demo has when it opens from `file://`.

**Three decisions the generator encodes**, each one the app owner's call:

1. **Lifting only.** 198 entries are dropped: 123 stretches, 61 plyometrics,
   14 cardio. Cardio is its own screen and the library is a lifting catalogue.
   688 of the 886 survive.
2. **Heads are derived from the exercise name.** The source has no head-level
   field, so Upper Chest, Side Delt, Long Head and the rest come from keyword
   rules in the generator. They are a first pass, not verified lift by lift.
   A wrong one is one line to fix.
3. **Neck folds into Back / Traps.** The body figure has no measured neck
   region, so 5 neck lifts join Traps rather than having nowhere to live. The
   other 3 neck entries are stretches and were dropped by rule 1.

**Nothing is renumbered.** A name already in the catalogue keeps its id, so a
logged set, a split day and the dev presets all still resolve after a
regeneration. 178 exercises from the previous catalogue that this delivery
does not contain are carried through rather than dropped, which is why the
shipped total is 866 and not 688.

**Known gaps, carried from the source README.** Images are not bundled, only
relative paths. `movement_pattern` is a heuristic. `aliases` is empty
everywhere. Variation grouping is name-based and unverified.
