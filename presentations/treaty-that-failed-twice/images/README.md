# Drop your photos here

The build auto-detects these two filenames (`.jpg`, `.jpeg`, `.png`, `.webp`
or `.tif`). If a file is absent, that slide falls back to its typographic
composition and the deck still builds — nothing breaks.

| Filename | Slide | Minimum pixels | What it should show |
|---|---|---|---|
| `slide1-cover` | 1, full bleed | 2560 x 1440 | A river choked with plastic, or a container port. **Not** the sad turtle — it's a cliché and it argues the wrong point, since this talk is about production, not wildlife. Keep the subject in the upper two-thirds; the lower third is covered by the title lockup. |
| `slide3-plenary` | 3, left panel | 1280 x 1440 (portrait-ish) | A negotiating plenary hall. Sits behind an 88% navy wash, so it reads as texture — grain and silhouette matter, fine detail does not. |

Both are converted automatically: cropped to fill, mapped onto a navy duotone,
and washed so every text element clears 4.5:1 contrast **even against a
pure-white source image**. You do not need to edit them first.

Free sources with usable licences:

- **Unsplash** — ocean, plastic waste, ports. Free, no attribution required.
- **IISD Earth Negotiations Bulletin on Flickr** — actual photographs of the
  INC plastics negotiations, including Busan and Geneva. Free to use **with
  credit to IISD/ENB**, which is the right source for `slide3-plenary`.

If you use an IISD/ENB image, add the credit to slide 3's source line in
`build.py` — search for `Membership: HAC`.

## Cropping

`duotone()` takes a `focus` argument, `(x, y)` from 0–1, controlling which
point survives the crop. Defaults are `(0.5, 0.42)` for the cover and
`(0.5, 0.45)` for the panel — slightly above centre, where horizons and faces
usually sit. Adjust in `build.py` if your photo's subject is off-centre.
