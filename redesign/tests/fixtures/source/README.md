# LOCKED exercise library

886 exercises, ready to import. Built from one legally clean open dataset plus an attributed creator-cue layer.

## What's in here

- `all-exercises.json` — every exercise, one flat file.
- `master-index.json` — counts by muscle group, equipment, difficulty, category, movement pattern. Start here.
- `by-muscle-group/*.json` — the same 886 exercises split into 17 files, one per primary muscle.
- `creator-disagreements.json` — 4 documented spots where Jacob Oestreicher and TNF give conflicting guidance on the same movement.

## Where the data comes from

**Base layer (876 exercises):** [free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain (Unlicense). Free to use commercially, no attribution required, no license risk. Each entry has name, equipment, primary/secondary muscles, difficulty, step-by-step instructions, and image references.

**Creator layer (10 new exercises, 16 cue overlays):** Pulled from the research pass on Jacob Oestreicher (@jacoboestreichercoaching) and TNF/Joel Twinem (@t_nutrition_fitness). Every cue carries a `creator_notes` entry with the creator's name and the exact source (video ID, TikTok Discover page, or BarBend article). Cues sourced from AI-summarized TikTok aggregation pages are marked `unverified` in their source string — re-check against the original video before treating them as a direct quote.

**Not included:** Strong, Hevy, Fitbod, JEFIT, and StrengthLog exercise text. Those libraries are proprietary and behind app ToS — they were used for competitive benchmarking only, not as a data source. See the earlier research report for those findings.

## Schema

Every exercise record:

```
id                        stable slug, matches free-exercise-db where applicable
name                       display name
aliases                    empty by default, fill in as you find alt names
primary_muscles            array, e.g. ["chest"]
secondary_muscles          array
equipment                  barbell / dumbbell / cable / machine / bodyweight / etc.
movement_pattern            push / pull / squat / hinge / isolation / carry_isometric / other
                             (heuristically derived from force + mechanic + muscle group — spot-check before shipping)
mechanic                   compound / isolation
force                      push / pull / static / null
difficulty                 beginner / intermediate / expert
category                   strength / powerlifting / olympic weightlifting / stretching / cardio / plyometrics / strongman
instructions               ordered array, from free-exercise-db (empty for creator-original entries)
creator_setup_cues         flattened setup cues from the creator layer
creator_execution_cues     flattened execution cues from the creator layer
creator_common_mistakes    flattened mistake call-outs from the creator layer
creator_notes              full attribution: creator name + source + cue text, per creator
variation_group            normalized base movement name, used to link variations
variations                 array of other exercise ids sharing the same variation_group
images                     relative paths into the free-exercise-db media repo (binaries not bundled here, see below)
source_apps                ["free-exercise-db"] or [] for creator-original entries
source_creators            ["jacob-oestreicher"] / ["tnf-joel-twinem"] / both / empty
creator_original           true only on the 10 movements that don't exist in free-exercise-db
```

## Known gaps, check before shipping

- **Images aren't bundled.** `images` holds relative paths (e.g. `3_4_Sit-Up/0.jpg`). The actual JPGs live in the free-exercise-db GitHub repo, public domain, ~2,600 files. Pull them separately if you want in-app images rather than bloating this delivery with binaries.
- **`movement_pattern` is a heuristic**, built from force + mechanic + primary muscle keywords, not hand-labeled. It's a reasonable first pass, not verified exercise by exercise. Spot-check before using it to drive workout generation logic.
- **`aliases` is empty everywhere.** Free-exercise-db doesn't track alternate names. Fill in as your users search for things like "flat bench" vs. "bench press."
- **Variation grouping is name-based**, not verified by a human. It'll catch "Barbell Bench Press" and "Dumbbell Bench Press" as variations of each other, but it can also mis-group exercises that happen to share words. Spot-check the `variations` field before surfacing substitutions to users.
- **Only 16 of 886 exercises have creator cues.** That's every cue that could be confidently matched to a specific free-exercise-db entry from the research pass. Extending creator coverage means going back through more of each creator's video catalog and matching against the remaining ~870 entries.
- **Cardio and stretching entries are included** (123 stretches, 14 cardio movements) since they were in the source dataset. Filter on `category` if LOCKED's Train tab should be lifting-only.
