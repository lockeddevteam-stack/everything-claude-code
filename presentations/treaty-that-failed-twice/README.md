# The Treaty That Failed Twice

A 7-slide, 16:9, five-minute talk on the UN Global Plastics Treaty and what
failing twice did to the environmental movement.

    python3 build.py        # writes The-Treaty-That-Failed-Twice.pptx

`build.py` is the single source of truth. The `.pptx` is generated output —
edit the script, not the deck, or the next build silently discards your work.

## Design system

| Role | Value | Notes |
|---|---|---|
| Dominant | navy `0B1B2B` | slides 1, 5, 7 and the left panel of slide 3 |
| Support | bone `F2EFE9` | slides 2, 3, 4, 6 |
| Accent on dark | amber `E8663A` | 5.33:1 on navy |
| Accent on light | deep amber `B03E17` | 5.19:1 on bone |
| Muted on light | slate `4A6B7C` | 5.02:1 on bone |
| Muted on dark | slate-light `8FA9B8` | 7.05:1 on navy |

**Why the accent has two values.** No single amber clears 4.5:1 against both
navy and bone — the requirement is contradictory (it needs relative luminance
above 0.175 on navy and below 0.153 on bone). Both values sit at hue 15°, so
they read as one accent at two lightnesses. Every text/background pair in the
deck clears 4.5:1.

Type: Cambria Bold headings, Calibri body — both ship with Office on Windows
and Mac, so nothing substitutes on the presenting machine. Scale is fixed at
title 40 / big stat 88 / row 20 / quote 24 / header 28 / body 16 / label 13 /
caption 10 pt.

Grid: 0.6" safe margin, 12 columns of 0.828" with 0.2" gutters, 1.028" pitch.
Nothing crosses 6.9" vertically except deliberate full-bleed panels.

Motif: one key word per slide wrapped in `[square brackets]` in the accent
colour — a reference to the 154 bracketed disagreements still in the draft
treaty text. It appears on slides 2, 3, 4, 5, 6 and 7.

## Photographs

Drop two files into `images/` and they are picked up automatically — see
`images/README.md` for filenames, sizes and sources. Each is cropped to fill,
mapped onto a navy duotone and washed so that every text element clears 4.5:1
**even against a pure-white source image**, which is verified by measuring the
composited background rather than assumed.

With no files present the deck builds a typographic composition instead, so it
is always shippable. Slide 1 changes shape between the two:

| | No photo | With `slide1-cover` |
|---|---|---|
| Visual | Two-bar production chart, 460 vs 1,231 Mt | Full-bleed duotone, empty top two-thirds |
| The figures | Encoded in the bars | A line of type in the lockup |

The chart is dropped in the photo variant deliberately: small amber and slate
chart labels cannot hold 4.5:1 over an unknown photograph at any scrim
strength, so the numbers become type rather than becoming illegible.

## Two deviations from the original plan

1. **The photographs are not included.** The session that built this had no
   network egress to any image host — Unsplash, Wikimedia, Flickr, Pexels and
   Pixabay all refused. Rather than generate fake imagery of real UN
   negotiations, the pipeline above was built so real photos drop in later.
2. **Slide 6 drops the "We've gone backwards" pull quote.** The quote could
   not be attributed to a named speaker with confidence, and a misattributed
   quote in a graded talk is worse than no quote. The slide instead makes the
   August 2026 draft's removal of `production` its dominant element.

## Animation

Slide 5 reveals one row per click, four clicks total. It is the only animation
in the deck. python-pptx has no animation API, so `add_click_build()` writes
the `<p:timing>` tree by hand; the package passes OOXML schema validation, but
it was authored in a Linux container and has not been opened in real
PowerPoint. Set `ANIMATE = False` at the top of `build.py` and rebuild for a
static slide 5.

## Rebuilding the QA renders

    soffice --headless --convert-to pdf --outdir . The-Treaty-That-Failed-Twice.pptx
    pdftoppm -jpeg -r 150 The-Treaty-That-Failed-Twice.pdf slide

Requires `libreoffice-impress`, `poppler-utils`, and the `fonts-crosextra-carlito`
and `fonts-crosextra-caladea` packages — those two are metric-compatible with
Calibri and Cambria, so the rendered previews measure text the same way
PowerPoint will.
