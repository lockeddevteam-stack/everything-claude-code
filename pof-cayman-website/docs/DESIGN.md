# Visual system

Direction: Youth Voice, Island Ground. Hand-painted protest energy over a restrained editorial base.

## The three distinctive moments

1. The homepage hero: deep ocean, the mission in the founders' words, and the painted sheet.
2. The slogan sheet, `SloganBlock`, once per page at most, on the single most important line. It is drawn from the banner series: white bedsheets, hand-painted capitals, torn edges.
3. The stat band: the first verified number set at 96px on ocean. Nothing else on the site is set that large.

Everything else is quiet type on a twelve-column grid.

## Palette

| Token | Value | Use |
|---|---|---|
| ocean | #0B2E42 | Anchor. Dark sections, primary buttons on light |
| ocean-deep | #07202F | Footer |
| reef | #3ED2C3 | Accent fill on dark surfaces. Interactive only |
| reef-ink | #0C6E6B | Accent for link text and the Donate button on light surfaces (5.7:1 on paper) |
| reef-on-dark | #5EE0D2 | Link text on ocean (8.8:1) |
| sand | #F1EADC | Warm neutral background |
| mangrove | #2C4A3C | Secondary blocks only |
| ink / paper | #15202B / #FBF8F2 | Type. Never #000 or #FFF |
| sheet / paint | #F6F1E6 / #1B2A38 | The slogan device only |

Rule: if the accent appears on anything that is not clickable, the site has lost its signal.

These tones were chosen against Cayman references (open water off the West Bay wall, shallow water over sand at Seven Mile Beach, ironshore, the Central Mangrove Wetland). When POF supplies rights-cleared photographs, re-sample and confirm against them, then re-run `node scripts/contrast.mjs`.

## Type

Display: Bricolage Grotesque, self-hosted, weights 400 to 800. Body: Newsreader, self-hosted, optical sizes. Two families, no more. Scale 16 / 20 / 25 / 31 / 39 / 49 / 61 at a 1.25 ratio. Body line-height 1.6, headings 1.15, hero 1.1. Measure 68ch.

## Space

4 / 8 / 16 / 24 / 40 / 64 / 96 / 160. Nothing else. Section rhythm alternates 64 and 96 on desktop, 40 and 64 on mobile.

## Layout

Twelve columns. Left-weighted and right-weighted sections alternate down each page. Three items are always one dominant and two supporting. Radius is 2px on controls, 6px on panels, and nowhere else.

## Motion

Reveal on scroll only: 320ms, opacity and a 12px rise from scale 0.985, `cubic-bezier(0.23, 1, 0.32, 1)`, 50ms stagger. Everything is off under `prefers-reduced-motion: reduce`.
