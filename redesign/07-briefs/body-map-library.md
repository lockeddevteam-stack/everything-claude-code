# Exercise Library as an anatomical body map

Plan, for approval before building. Requested by Cesco, 2026-09-09.

## What was asked

Replace the list-first library with a rotating skeleton, front and back, with each muscle
group in its own colour. Tap a group to select it and see what it is, with an Open control.
Opening zooms into that muscle, shows its parts highlighted, and selecting a part lists the
exercises. Alongside this: more icons and imagery, more vibrance, better organisation, and
real animation, while staying minimal.

## The flow, four stages

**1. Body.** A full anatomical figure fills the screen. Front by default. Every muscle group
carries its own hue at rest, so the body reads as a legend without needing one. A rotate
control flips to the back. Nothing else competes: no list, no cards, one screen title.

**2. Selected.** Tapping a group lifts it to full saturation and drops every other group to a
near-neutral tint, so the selection is unmistakable. A card rises from the bottom naming the
group, with what the lifter actually wants to know before committing a tap: how many exercises
it holds, and what they have trained there recently. Its primary action is Open.

**3. Zoomed.** The figure scales and pans so the chosen group fills the frame, and the group's
parts become individually tappable, each a tint of the parent hue so the relationship is
visible. Upper, mid and lower chest read as one family. A back control returns to the body.

**4. Exercises.** Selecting a part lists its exercises using the row component every other
screen uses. Search stays available throughout, because a lifter who knows the name should
never have to navigate anatomy to find it.

## How this stays minimal

Colour appears on the body and nowhere else. The body is data, not chrome, so an anatomy
palette is legitimate in the same way a chart palette is: it encodes which muscle is which.
Every other surface stays monochrome, and the accent orange remains reserved for the one
primary action on screen. That contrast is what makes the body vivid rather than noisy.

The palette is six hues, well separated, none of them orange, so the body can never be
confused with an action:

| Group | Hue |
|---|---|
| Chest | rose |
| Shoulders | violet |
| Back | blue |
| Arms | teal |
| Core | gold |
| Legs | green |

These are added to `tokens.css` as a documented data palette, not as new UI colours, with
measured contrast for any label drawn on them.

## Animation, and what each one is for

- **Rotation, front to back.** The figure turns rather than cutting, so the lifter keeps their
  sense of which side they are looking at. 300ms with the spring easing.
- **Selection.** Saturation lifts on the chosen group and falls on the rest in 150ms. Nothing
  moves, because movement would suggest something happened beyond a selection.
- **Zoom.** The view scales into the group over 300ms, carrying the selection with it, so the
  lifter sees where they came from. This is the transition that earns its place: it is the
  whole reason the navigation feels anatomical rather than menu-driven.
- **Parts appearing.** Sub-regions fade up in sequence after the zoom settles, so the eye is
  led to them rather than surprised by them.

Everything above collapses to a single frame under reduced motion.

## Accessibility, which a body map threatens

- Colour alone never carries meaning. Every group has a visible label on selection and an
  accessible name on its shape, so a screen reader announces "Chest, 30 exercises" rather
  than a path.
- Every muscle region gets a hit area of at least 44 by 44, enlarged behind small shapes such
  as biceps and calves where the drawn muscle is narrower than the minimum.
- The whole map is keyboard navigable: groups are a focusable list in anatomical order, with
  a visible focus ring that follows the shape.
- Search remains the fast path, so the map is never the only way through.

## Open questions for Cesco

1. Anatomical figure or a stylised silhouette. A real anatomical rendering is more striking
   and more useful for identifying a muscle you cannot name; a silhouette is calmer and
   cheaper to draw well. The mockup shows the stylised route, which I recommend.
2. Whether the body should also encode training recency, for example a group you have not
   trained in two weeks reading dimmer. Useful, but it competes with the group hues, so it
   would need to be a toggle rather than the default.

## Status

Not built. Mockup only, for approval.
