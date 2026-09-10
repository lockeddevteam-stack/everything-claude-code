# Apple Design System Spec (iOS 26 / iOS 27, Liquid Glass Era) — v2

Scope: implementation-ready specification for recreating Apple's design 1:1 in native SwiftUI and on the web. Every value flagged **[Apple official]** or **[community-measured]**. Current as of September 9, 2026 (iOS 27 shipped this month). Omits philosophy, history, and screen-anatomy material already covered in your two research documents.

v2 adds sections 8 through 13: navigation and app structure, controls and components, web feel, accessibility, a recreation checklist, and known gaps.

---

## 1. TYPOGRAPHY

### 1.1 Dynamic Type base sizes at Large (default)
**[Apple official]**

| Style | Size (pt) | Weight | Leading (pt) |
|---|---|---|---|
| Large Title | 34 | Regular | 41 |
| Title 1 | 28 | Regular | 34 |
| Title 2 | 22 | Regular | 28 |
| Title 3 | 20 | Regular | 25 |
| Headline | 17 | Semibold | 22 |
| Body | 17 | Regular | 22 |
| Callout | 16 | Regular | 21 |
| Subheadline | 15 | Regular | 20 |
| Footnote | 13 | Regular | 18 |
| Caption 1 | 12 | Regular | 16 |
| Caption 2 | 11 | Regular | 13 |

iOS 17+ adds Extra Large Title (36pt Bold) and Extra Large Title 2 (28pt Bold) for onboarding and marketing headers.

### 1.2 Full size-category matrix
**[Apple official]** Categories: xSmall, Small, Medium, Large (default), xLarge, xxLarge, xxxLarge, then AX1 through AX5. Since iOS 11 every style scales across all categories.

Body anchors: xSmall 14, Small 15, Medium 16, Large 17, xLarge 19, xxLarge 21, xxxLarge 23, AX1 28, AX2 33, AX3 40, AX4 47, AX5 53.

Caption 2 holds at 11pt from xSmall through Large and only grows above Large. It never shrinks below 11.

Never hardcode. Use `preferredFont(forTextStyle:)` with `adjustsFontForContentSizeCategory = true`, or `.font(.body)` in SwiftUI. Scale custom fonts with `UIFontMetrics(forTextStyle:).scaledFont(for:)`.

### 1.3 Optical sizes and tracking
**[Apple official, WWDC20]** SF Pro has two optical sizes: **Text** below 20pt, **Display** at 20pt and up. With the variable font the transition is a smooth `opsz` axis interpolated between 17 and 28pt, not a hard breakpoint. Text gets wider spacing, heavier strokes, more open counters. Display gets tighter spacing and refined proportions.

APIs that resolve opsz automatically: `preferredFont(forTextStyle:)`, `systemFont(ofSize:)`, `systemFont(ofSize:weight:)`, `CTFontCreateUIFontForLanguage()`.

Apple publishes an SF Pro tracking table in 1/1000em units. Tracking applies automatically at runtime, so you only need the numbers for static mockups and web. Representative values **[community-measured from Apple's table]**: 17pt ≈ −0.43px, 28pt ≈ −0.8px. Small sizes get positive tracking, large display sizes get negative.

SF Pro numbers are proportional by default. Use OpenType tabular lining for anything that updates in place: timers, weights, prices, counters.

### 1.4 Font families and licensing
**[Apple official]**
- **SF Pro** — system font, iOS/iPadOS/macOS. Nine weights Ultralight through Black, plus italics, variable optical sizing.
- **SF Compact** — watchOS, narrower forms for small round displays.
- **SF Mono** — code and terminal.
- **New York** — serif, editorial and reading contexts, own optical sizes.
- **SF Pro Rounded** — pair with soft or rounded elements, matched to the equivalent Text/Display style.

**Licensing matters for web.** SF and New York are free from Apple but licensed for designing and developing **for Apple platforms only**. You may not self-host SF Pro on a general website. Use the system stack instead:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif;
```

This renders SF on Apple devices and falls back elsewhere. Inter is the standard licensed substitute for cross-platform parity.

### 1.5 iOS 26 / 27 typography changes
**[community-measured]** Liquid Glass leans on bolder, heavier title weights and large left-aligned titles that morph to 17pt semibold centered on scroll. iOS 27 changed materials and icons, not the type scale.

### 1.6 Cross-platform scales
**[Apple official]** macOS runs smaller: Body 13pt, Large Title 26pt, with a separate tracking table. watchOS uses SF Compact on its own compact scale. visionOS uses larger minimums for depth legibility. Each platform's HIG has a Specifications → Typography page.

---

## 2. SF SYMBOLS

### 2.1 Weights and scales
**[Apple official]** Nine weights matching font weights: Ultralight, Thin, Light, Regular, Medium, Semibold, Bold, Heavy, Black. Three scales: Small, Medium (default), Large.

Match a symbol's weight to the text beside it. Inline symbols align to the text baseline by default. In SwiftUI, set `.font()` to the adjacent text style and use `.imageScale()`.

### 2.2 Rendering modes
**[Apple official]** Monochrome (single color), Hierarchical (one hue, layers by opacity), Palette (2 to 3 explicit colors), Multicolor (intrinsic colors). SwiftUI: `.symbolRenderingMode(.monochrome / .hierarchical / .palette / .multicolor)`.

### 2.3 Animation effects
**[Apple official]**
- SF Symbols 5 / iOS 17: Bounce, Pulse, Scale, Variable Color, Replace, Appear, Disappear.
- SF Symbols 6 / iOS 18: Wiggle, Rotate, Breathe, Magic Replace.
- SF Symbols 7 / iOS 26 and SF Symbols 8 / iOS 27 extend further. Icon Composer 2 shipped alongside WWDC26.

Categories: **discrete** (one-shot, Bounce), **indefinite** (repeats while active: Pulse, Breathe, Rotate, Variable Color), **content transition** (Replace).

```swift
Image(systemName: "bell.fill").symbolEffect(.bounce, value: count)
Image(systemName: "heart.fill").symbolEffect(.pulse)
Image(systemName: "wifi").symbolEffect(.variableColor.iterative)
Image(systemName: isPlaying ? "pause.fill" : "play.fill")
    .contentTransition(.symbolEffect(.replace))
```

Directional options exist (`.bounce.up`, `.scale.up`, wiggle and rotate axes). Attach an effect to mark a moment, not to decorate.

---

## 3. SHAPES AND CORNER GEOMETRY

### 3.1 Superellipse corners
**[community-measured]** Apple icons and continuous corners are superellipse-based. Figma's iOS preset is **60% corner smoothing**. App icon radius ≈ **22.37% of width**, exponent ≈ **5**.

Per Daniel Furse's Figma engineering post, Apple and Figma do not use a pure superellipse formula. They splice cubic Béziers to a central circular arc, where a smoothing factor s (0 to 1) controls how much of the straight edge transitions into the arc. s = 0 is a plain rounded rect, s ≈ 0.6 is the iOS look.

Native: `RoundedRectangle(cornerRadius:style: .continuous)`, or `CALayer.cornerCurve = .continuous`.

Web: `border-radius` alone draws a circular arc with a visible kink. Use `corner-shape: superellipse()` (Chromium-only, ~65% of users, not Baseline) with a JS/SVG `clip-path` fallback (squircle.js or cornerKit at `smoothing: 0.6`).

### 3.2 Component corner radii
**[community-measured conventions]**
- Buttons: capsule by default (radius = height/2).
- Capsules (sliders, switches, pills): height/2.
- Inset-grouped cells: historically ~10pt, now driven by concentricity.
- Cards: 12 to 20pt continuous.
- Alerts ~14pt. Context menus ~13pt.
- Sheets and popovers: system-drawn, concentric with the screen.
- Widgets: system radius ~21.5pt on modern iPhones. Use `ContainerRelativeShape`.
- Search fields, toggles, segmented controls, keyboard keys: capsule or continuous rounded.

### 3.3 Per-device screen corner radii
**[community-measured, Kyle Bashour's ScreenCorners]**

| Radius (pt) | Devices |
|---|---|
| 39.0 | iPhone XR, 11 |
| 44.0 | iPhone X, XS, XS Max, 11 Pro, 11 Pro Max |
| 47.33 | 12 mini, 13 mini, 12 Pro Max, 13 Pro Max, 14 Plus |
| 53.33 | 12, 12 Pro, 13, 13 Pro, 14, 14 Pro, 14 Pro Max, 15 line, 16, 16 Plus |
| 55.0 | 16 Pro, 16 Pro Max, 17, 17 Pro, 17 Pro Max, Air |
| 62.0 | iPad Air / iPad Pro (M-series) |

Older iPads measured ~41.5pt. Set `layer.cornerCurve = .continuous` when matching. iOS 26+ exposes a public display-corner-radius API replacing the old private selector.

### 3.4 Concentricity rules (WWDC25 session 356)
**[Apple official]** Three shape types:
- **Fixed** — constant radius.
- **Capsule** — half the container height.
- **Concentric** — inner radius = parent radius − padding, sharing a center.

Rules:
- **iPhone:** capsule with extra margin near the screen edge.
- **iPad and Mac:** concentric shape aligned to the window edge.
- Components that work both nested and standalone: concentric shape **with a fallback radius**.
- Never nest an identical radius inside its parent. That produces the pinched look.

APIs: `ConcentricRectangle`, `.rect(corner: .containerConcentric)`, `.cornerConfiguration(.containerRelative)` for glass. macOS Tahoe: toolbar windows use a larger radius wrapping the glass toolbar, titlebar-only windows a smaller one.

---

## 4. ANIMATION PHYSICS AND MOTION

### 4.1 Spring presets
**[community-measured, matches observed behavior]**

| Preset | duration | bounce | Character |
|---|---|---|---|
| `.smooth` | 0.5s | 0.0 | Critically damped, no overshoot |
| `.snappy` | 0.5s | 0.15 | Small overshoot |
| `.bouncy` | 0.5s | 0.3 | Visible overshoot |

`extraBounce` is additive on top of the preset. Bounce range −1.0 to 1.0. Stay under ~0.4 for UI.

Response/damping model defaults **[community-measured]**:
- `.spring`: response **0.55**, dampingFraction **0.825**, blendDuration 0.
- `interactiveSpring`: response **0.15**, dampingFraction **0.86**, blendDuration **0.25**. Use for anything tracking a finger.
- `interpolatingSpring`: mass 1, initialVelocity 0, stiffness and damping required. Accumulates overlapping animations, unlike `.spring`.

Since iOS 17 the SwiftUI default animation is a spring. App launch, list-to-detail, and navigation all use springs.

### 4.2 Spring math (WWDC23, corrected)
The on-slide damping equation was wrong. Corrected version, confirmed in Apple Developer Forums thread 739811:

```
mass       = 1
stiffness  = (2π / duration)²
damping    = ((1 − bounce) × 4π) / duration        // bounce ≥ 0
damping    = 4π / (duration × (1 + bounce))        // bounce < 0
dampingRatio = 1 − bounce                          // bounce ≥ 0
dampingRatio = 1 / (1 + bounce)                    // bounce < 0
```

So for the non-negative range, dampingFraction = 1 − bounce. Read converted values with `Spring(duration:bounce:).mass/.stiffness/.damping`. Never wait for settling duration on user-facing state changes. Use the completion handler (perceptual duration).

### 4.3 System durations and curves
**[Apple official / community-measured]**
- Core Animation default: **0.25s**.
- Keyboard show/hide: **0.25s**, read exact curve and duration from the `keyboardWillShow` notification userInfo.
- easeInOut ≈ `cubic-bezier(0.42, 0, 0.58, 1)`.
- Navigation push/pop, sheet present, modal dismiss, tab switch: springs since iOS 17, not fixed curves.
- Scroll deceleration **[Apple official]**: `UIScrollViewDecelerationRateNormal = 0.998`, `Fast = 0.99`. Per-millisecond velocity multiplier. WKWebView uses 0.998.
- Rubber-banding **[community-derived]**: `x = (1.0 − (1.0 / ((offset × c / dim) + 1.0))) × dim`, c ≈ 0.55.

### 4.4 Web easing equivalents
**[community-measured]** easeInOut → `cubic-bezier(0.42, 0, 0.58, 1)`. CA default ≈ `cubic-bezier(0.25, 0.1, 0.25, 1)`.

Framer Motion springs: snappy ≈ stiffness 400 / damping 40, balanced ≈ 260 / 20, graceful ≈ 100 / 15. For exact parity, compute stiffness and damping from duration and bounce using §4.2.

### 4.5 Liquid Glass motion
**[Apple official, WWDC25 sessions 219 / 323]**
- Glass morphs between shapes. Group with `GlassEffectContainer(spacing:)`. That spacing is the merge threshold. Drive transitions with `glassEffectID` inside a `@Namespace`.
- **Glass cannot sample other glass.** Always group.
- `.glassEffect(.regular.interactive())` adds scale, bounce, and shimmer on touch.
- Tab bar shrink: `.tabBarMinimizeBehavior(.onScrollDown)`. Bottom shelf: `.tabViewBottomAccessory { }`.
- Glass adapts opacity by size (larger more opaque, smaller clearer) and flips light/dark by sampled content.
- iOS 26 specular highlights respond to gyroscope. **iOS 27 removed** the gyroscope-driven directional specular on app icons.

### 4.6 Haptic pairing
**[Apple official]**
- `UIImpactFeedbackGenerator` (light / medium / heavy / soft / rigid) — collisions, detents, toggle snaps, drag drops.
- `UISelectionFeedbackGenerator` — selection changes, pickers, segmented scrubbing.
- `UINotificationFeedbackGenerator` (success / warning / error) — task completion.

SwiftUI `.sensoryFeedback(_:trigger:)`: `.success`, `.warning`, `.error`, `.selection`, `.impact(weight:intensity:)`, `.increase`, `.decrease`, `.start`, `.stop`, `.alignment`, `.levelChange`.

Core Haptics uses two continuous parameters: **intensity** (0 to 1, strength) and **sharpness** (0 to 1, dull to crisp).

### 4.7 Reduce Motion
**[Apple official]** Apple swaps slide and zoom for **crossfades**, disables parallax, reduces symbol and glass animation. Web: `@media (prefers-reduced-motion: reduce)`, replace transforms with opacity fades. Liquid Glass separately honors Reduce Transparency and Increase Contrast. Test all three.

---

## 5. LAYOUT AND COMPOSITION

### 5.1 Margins, safe areas, bar heights
**[community-measured / Apple official]**
- Default layout margin **16pt** on standard iPhones, **20pt** on Plus/Max/Pro Max and iPad.
- Top safe-area inset 44 to 59pt on Face ID and Dynamic Island devices.
- Navigation bar **44pt**. Large-title nav bar ~**96pt** (44 + 52), ~116pt including status bar.
- Tab bar iPhone **49pt** portrait, ~83pt including home indicator. 32pt landscape. iPad tab bar / toolbar 50pt.
- Home indicator inset **34pt** portrait.
- Readable content guide caps line length ~672pt on wide layouts.

**Quirk:** on notched and Dynamic Island phones `layoutMargins.left` returns 20 vs 16 on smaller phones, misaligning inset-grouped cells against the large title. Set `layoutMargins = .zero` to force 16.

### 5.2 Control sizes
- Toggle **51 × 31pt**.
- Minimum touch target and list row **44 × 44pt**.
- Control sizes: mini, small, regular, large, **extraLarge** (iOS 26). On macOS extraLarge maps to large.
- Segmented control ~32pt tall.
- Text field ~44pt tappable.

### 5.3 Spacing grid
**[community-measured]** 8pt base with 4pt sub-steps: **4 / 8 / 12 / 16 / 20 / 24 / 32**. 16pt screen margins, 8pt intra-group, 20pt section gaps, 12 to 16pt card padding.

---

## 6. COLOR AND MATERIALS

### 6.1 System colors and semantic layers
**[Apple official]** WWDC25 re-tuned all system colors for Liquid Glass. Everything is dynamic light/dark.

Label opacities, light mode **[community-measured]**: `label` 100%, `secondaryLabel` ~60%, `tertiaryLabel` ~30%, `quaternaryLabel` ~18%. Dark mode uses white at comparable alphas. Note `label` is 0.85 on Mac Catalyst.

Fills encode alpha in 8-digit hex: `systemFill` = `#78788033` light, `#7878805C` dark. Alpha increases in dark mode for contrast.

- Grays: `systemGray` plus `systemGray2` through `systemGray6`.
- Plain backgrounds: `systemBackground` / secondary / tertiary.
- Grouped backgrounds: `systemGroupedBackground` / secondary / tertiary. Use these with inset-grouped lists.
- Fills: `systemFill` through `quaternarySystemFill`, thin to thick overlays.
- Separators: `separator` is semi-transparent, `opaqueSeparator` is solid.

Use semantic colors always. Never hardcode black or white.

### 6.2 Materials
**[Apple official names]** `.ultraThinMaterial`, `.thinMaterial`, `.regularMaterial`, `.thickMaterial`, `.ultraThickMaterial`, plus `.bar`. Vibrancy tiers: primary, secondary, tertiary, quaternary. Apple does not publish blur radii or tint opacities. The ordering is the only guaranteed contract.

**Liquid Glass variants [Apple official]**
- **Regular** — adaptive, legible over anything, any size. The default. Anything can sit on top.
- **Clear** — permanently transparent, no adaptation, needs a dimming layer for legibility. Only for small surfaces over rich media.

APIs: `Glass.regular`, `Glass.clear`, `Glass.identity`, `.glassEffect(_:in:)`, `.buttonStyle(.glass)` / `.glassProminent`. Tint only with semantic meaning.

### 6.3 iOS 27 material changes
**[community-measured, MacRumors / WWDC26]** Darkened edge stroke around glass elements, brighter specular highlights, improved diffusion of complex backgrounds. A uniform toolbar appears at top when content scrolls under floating bars. Exact stroke and highlight values are unpublished. Treat as qualitative.

### 6.4 Web CSS recreation
**[community-measured]**

```css
.liquid-glass {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -1px 0 rgba(255,255,255,0.06),
    0 8px 32px rgba(0,0,0,0.35);
}
```

Readable blur range 12 to 30px. Glass needs three things: a vivid background behind it, sufficient blur, and a clear hairline edge.

True lensing needs an SVG `feDisplacementMap` (optionally `feTurbulence` plus `feSpecularLighting`) via `backdrop-filter: url(#filter)`. **Chromium-only.** Safari and Firefox ignore url() backdrop-filters and fall back to plain blur, so design the blur-only case first and ship it as the fallback. Always include the `-webkit-` prefix.

---

## 7. iOS 27 / WWDC 2026 CHANGES

**[community-measured, MacRumors / Tom's Guide / Neowin / 9to5Mac]**
- **Liquid Glass refined, not reduced.** Pre-WWDC rumors of a retreat were wrong.
- Material foundations tuned: darkened edge stroke, brighter speculars, better content diffusion.
- **System-wide transparency slider** in Settings → Display & Brightness, ultra-clear through fully tinted. Replaces the iOS 26.1 binary Clear/Tinted toggle. Hidden when Reduce Transparency is on.
- **App icons redesigned again:** extra glass layers baked into the artwork for a near-3D effect, sharper to fix iOS 26 blurriness complaints. Gyroscope-driven directional specular removed. **Icon Composer 2** supports multi-layer glass, refraction annotations, content-effect tuning, and interactive cross-version preview.
- **Uniform toolbar on scroll** for legibility.
- macOS 27 "Golden Gate": sidebar refinements and window radius updates.
- Performance: up to 30% faster app launches, 70% faster Photos library loads, 80% faster AirDrop.
- No devices dropped. Everything on iOS 26 gets iOS 27.
- **Design leadership:** Alan Dye, VP of Human Interface Design since 2015 and the executive most identified with Liquid Glass, left for Meta effective Dec 31, 2025 (Gurman, Dec 3, 2025). **Steve Lemay** replaced him. Worth tracking for where the language goes next.

---

## 8. NAVIGATION AND APP STRUCTURE

### 8.1 Navigation bar
**[Apple official, WWDC25 session 284]** Bars float above content in Liquid Glass. Bar button items automatically group into visual clusters sharing one glass background. Text buttons, system Done and Close buttons, and prominent-style buttons each get a separate background. `UINavigationItem` gained more control over title and large-title areas plus **subtitle** support.

Large-title collapse: 34pt bold left-aligned at rest, morphing to 17pt semibold centered on scroll. Never fake this with a scroll listener. Use `.navigationBarTitleDisplayMode(.large)`.

**Scroll edge effect [Apple official]:** scroll views under a bar get an automatic soft blur for legibility. Gotcha **[community]**: it only attaches when the `List` or `ScrollView` is a **direct descendant** of the `NavigationStack`. Wrapping content in a paged `TabView` breaks it and leaves a visible divider and whitespace gap. Tune with `.scrollEdgeEffectStyle()`.

### 8.2 Tab bar
**[Apple official + community]**
- Floats over content, semi-transparent, centered on iPhone, no longer glued to the bottom edge.
- Minimize on scroll: `.tabBarMinimizeBehavior(.onScrollDown)`. Collapses to the active tab, re-expands on reverse scroll.
- Bottom accessory (the shelf above tabs, Music's mini player): `.tabViewBottomAccessory { }`. Read `tabViewBottomAccessoryPlacement` from the environment and adapt when it collapses.
- Search tab role: `Tab(role: .search)`. Do **not** abuse it as a floating action button. VoiceOver announces it as a tab, it cannot be tinted, and you fight selection race conditions.
- iPad: tab bars and sidebars both float. `UITab` / `UITabGroup` auto-adapt.
- Hide on push: `.toolbar(.hidden, for: .tabBar)`.
- **[community]** The bubbly interactive glass press effect is private to tab bars and segmented controls. You cannot reproduce it on a custom view with public API. `.glassEffect(.regular.interactive())` is the closest approximation.

### 8.3 Search
**[Apple official]** iOS 26 moved it. The same `.searchable()` code now renders a glass search field at the **bottom on iPhone** (thumb reach) and **top trailing on iPad**. Restore the old iPad position with `.searchable(text:placement: .sidebar)`. Collapse to a toolbar button with `.searchToolbarBehavior(.minimize)`.

### 8.4 Sidebar and NavigationSplitView
**[Apple official]** Floating glass sidebar. Use `.backgroundExtensionEffect()` in SwiftUI or `UIBackgroundExtensionView` in UIKit so content extends under the sidebar without clipping. That is what produces the vibrant seamless look.

### 8.5 Zoom navigation transition
**[Apple official, iOS 18+]** The signature card-expands-into-screen motion:

```swift
@Namespace private var ns

NavigationLink {
    DetailView().navigationTransition(.zoom(sourceID: item.id, in: ns))
} label: {
    Card(item)
}
.matchedTransitionSource(id: item.id, in: ns)
```

The `matchedTransitionSource` configuration closure lets you set `clipShape` and shadow on the source. Source and destination IDs must match exactly. Use a **stable model ID**, never an array index. Available iOS 18+, tvOS 18, watchOS 11, visionOS 2. Unavailable on macOS.

**[community]** Known regression: on iOS 26.0 to 26.1 the source view can vanish after interactive drag-dismiss, with flicker and geometry mismatch versus iOS 18 (Apple Forums 807208). Test drag-dismiss specifically.

### 8.6 Sheets
**[Apple official]** `.presentationDetents([...])`. Built-in `.medium` (~half screen, inactive in compact height such as iPhone landscape) and `.large`. Custom `.fraction(0.3)`, `.height(400)`, or a `CustomPresentationDetent`. Default with no detent is `.large`. Sheets force full screen in compact-height size classes regardless.

- **Grabber** appears automatically with more than one detent. Override with `.presentationDragIndicator(.visible/.hidden)`. UIKit `prefersGrabberVisible`.
- **Dimming:** background dims automatically. Keep it live with `.presentationBackgroundInteraction(.enabled(upThrough: .medium))`, or UIKit `smallestUndimmedDetentIdentifier = .medium`. This is the Maps, Find My, and Stocks pattern.
- **Corner radius:** UIKit `preferredCornerRadius` (Apple's sample uses ~22pt), applied to the sheet **and** the parent card behind it. SwiftUI `.presentationCornerRadius()`.
- **iOS 26 [Apple official]:** partial-height sheets are **inset by default** with a glass background. At smaller heights the bottom edges pull inward to nest in the display's curved corners. Do not hardcode a bottom radius.
- Dim when the sheet interrupts the main flow. Skip dimming when the task runs in parallel.

### 8.7 Alerts, dialogs, menus, popovers
**[Apple official]** `.alert()` for a decision that must be made: title, optional message, 1 to 3 buttons, destructive role red, cancel role bold. `.confirmationDialog()` for a list of choices from a control: action sheet on iPhone, popover anchored to the source on iPad. `Menu` for option lists. `.contextMenu(menuItems:preview:)` for long-press with preview.

**[Apple official, WWDC25]** Glass rule: action sheets and menus should visually **spring from the control that triggered them**, not slide from the screen edge. Apply the material to the control, not to inner views.

### 8.8 Empty, loading, error states
**[Apple official]** `ContentUnavailableView` is the system pattern for empty states, `ContentUnavailableView.search` for zero results. No spinner under ~1s. Determinate progress with percentage over ~10s. Design the empty state as an instruction for the next action.

---

## 9. CONTROLS AND COMPONENTS

### 9.1 Buttons
**[Apple official]** iOS 26 styles: `.glass`, `.glassProminent`, `.borderedProminent`, `.bordered`, `.borderless`, `.plain`. Shape via `.buttonBorderShape(.capsule / .roundedRectangle / .circle)`. Size via `.controlSize()`.

On macOS, mini/small/medium keep rounded rectangles for dense inspector layouts. Large and X-Large use capsules.

Prefer `.glassProminent` plus `buttonBorderShape` over applying `.glassEffect` directly to a button. Buttons already carry the correct press reactions, and re-applying glass double-renders the material.

### 9.2 Lists
**[Apple official / community]**
- Styles: `.plain`, `.inset`, `.grouped`, `.insetGrouped`, `.sidebar`. Pair grouped backgrounds with grouped styles.
- Minimum row height 44pt. Separator inset aligns with the leading edge of text content. Since iOS 16 you align it explicitly:

```swift
Text(food.name).alignmentGuide(.listRowSeparatorLeading) { $0[.leading] }
```

- Also available: `.listRowSeparator(.hidden)`, `.listRowSeparatorTint(_:edges:)`, `.listRowInsets()`, `.listRowSpacing()`, `.listSectionSpacing()`, `.contentMargins(.top, _)`.
- Swipe actions: `.swipeActions(edge:allowsFullSwipe:)`. Trailing for destructive, leading for positive or toggle. Full swipe triggers the first action.
- A disclosure chevron means a push. Never put one on a row that opens a sheet.

### 9.3 Pickers, sliders, toggles, fields
**[community-measured / Apple official]** Toggle 51 × 31pt. Segmented control ~32pt tall, capsule in iOS 26. Sliders support tick marks (`SliderTick`) and fills from arbitrary anchor values. Text fields ~44pt tappable.

Set `.textContentType()` and `.keyboardType()` on every field. Autofill is a large part of why Apple forms feel fast.

Date pickers: `.compact` inline chip for forms, `.graphical` for calendar selection, `.wheel` only for time.

### 9.4 Widgets
**[community-measured, simonbs/ios-widget-sizes]**

| Device class | Small | Medium | Large |
|---|---|---|---|
| Compact (12/13 mini, 11 Pro) | 155×155 | 329×155 | 329×345 |
| Standard (12/13/14/15/16) | 158×158 | 338×158 | 338×354 |
| Max (12/13 Pro Max, 14 Plus) | 170×170 | 364×170 | 364×382 |
| iPhone 11 / XR | 169×169 | 360×169 | 360×379 |

Families: `systemSmall/Medium/Large/ExtraLarge`, `accessoryCircular/Rectangular/Inline`. Use `ContainerRelativeShape` for nested artwork so corners stay concentric with the system radius. Timeline reload budget is roughly 40 to 70 per day. User-initiated and app-foregrounding reloads are exempt.

### 9.5 Live Activities and Dynamic Island
**[Apple official]** Dynamic Island exists on iPhone 14 Pro and every Pro model since. Regular 14 and 15 do not have it.

Four presentations to design: **compactLeading**, **compactTrailing**, **minimal** (two activities sharing the island), **expanded** (leading, trailing, center, bottom regions).

`ContentState` must stay under **4KB**. Lock Screen and island have fixed maximums, oversized images clip or scale. Use SF Symbols for guaranteed rendering.

---

## 10. RECREATING THE FEEL ON WEB

**[community-measured]** The details that separate a convincing recreation from an obvious one:

- **Momentum scroll:** `-webkit-overflow-scrolling: touch`. Match deceleration to 0.998 per ms if you hand-roll physics. Add rubber-band overscroll (§4.3) instead of a hard stop.
- **Tap highlight:** kill `-webkit-tap-highlight-color` and build your own 0.1 to 0.15s press state. iOS buttons respond on touch-down, not click.
- **Safe areas:** `env(safe-area-inset-*)` with `viewport-fit=cover`.
- **Type:** system font stack plus `-webkit-font-smoothing: antialiased` and explicit `letter-spacing` from the tracking table. Browsers do not apply Apple's optical tracking automatically.
- **Springs:** Framer Motion, or compute stiffness and damping from §4.2 for exact parity.
- **Corners:** `corner-shape` where supported, SVG clip-path everywhere else. Plain `border-radius` reads wrong above ~16px.
- **Glass:** §6.4. Always ship the blur-only fallback.
- **Haptics:** the Vibration API is unsupported in Safari on iOS. There is no web equivalent to the Taptic Engine. Compensate with tighter visual press states.
- **Dark mode:** `@media (prefers-color-scheme: dark)` on your semantic token layer, never per-component overrides.

---

## 11. ACCESSIBILITY

Not optional polish. Liquid Glass shipped broken partly because it was treated that way.

- Support Dynamic Type through **AX5 (~310%)**. Test every screen at AX5. That is where hardcoded frames break.
- Honor **Reduce Motion**, **Reduce Transparency**, and **Increase Contrast** independently. Test combinations.
- Contrast 4.5:1 body, 3:1 large text and interface components, held across normal, pressed, disabled, and focused states.
- Label every interactive element for VoiceOver. Group with `.accessibilityElement(children: .combine)`. Never let a decorative image take focus.
- Never encode meaning in color alone. Pair with a symbol or label.
- 44 × 44pt minimum targets. No exceptions for small icons.

---

## 12. THE 1:1 RECREATION CHECKLIST

Run a screen through this to verify it reads as Apple-native:

1. Type comes from the 11-style scale, never arbitrary sizes. Tracking per size. Optical split at 20pt.
2. Every corner is continuous, and nested corners are concentric. Nothing shares a radius with its parent.
3. Every spacing value sits on the 4/8 grid. Screen margin 16pt, 20pt on wide devices.
4. Exactly one accent tint per surface, on the primary action only. Everything else semantic gray.
5. Every animation is a spring, interruptible, 200 to 500ms, carrying gesture velocity.
6. Every action has haptic feedback of the correct class.
7. Glass appears only in the chrome layer. Content cards are opaque.
8. Large title collapses natively. Search sits at the bottom on iPhone.
9. Sheets use detents, show a grabber when resizable, dim only when interrupting.
10. All symbols are SF Symbols, weight-matched to adjacent text.
11. The screen survives AX5 type, Reduce Motion, Reduce Transparency, and dark mode.
12. The primary element is identifiable within two seconds.

---

## 13. KNOWN GAPS AND CAVEATS

- Apple publishes **no** exact blur radii or tint opacities for the five materials or for Liquid Glass. Ordering is the only guaranteed contract. Anything numeric is a screenshot measurement.
- iOS 27 edge-stroke and specular values are unpublished. §6.3 is qualitative until Design Resources are measured.
- Spring preset numbers are community-derived. Apple documents them qualitatively. They match observed behavior but are not in official docs.
- The bubbly interactive glass press effect on tab bars and segmented controls uses private API. Full fidelity means reimplementing the tab bar.
- Screen corner radii came from a formerly-private API. The iOS 26+ public display-corner-radius API is the durable path.
- Liquid Glass still moves release to release. Re-verify anything visual against the current point release before shipping.

---

## What to put in your design tokens file

- **Type:** 11 core styles plus 2 extra-large titles, size/weight/leading/tracking per size category. Optical split at 20pt. Web stack `-apple-system, system-ui`.
- **Spacing:** 4 / 8 / 12 / 16 / 20 / 24 / 32. Screen margins 16pt, 20pt wide devices.
- **Radii:** capsule (h/2), concentric (parent − padding), fixed set {10, 12, 14, 20}. Per-device screen-radius map. Widget ~21.5pt. Always continuous.
- **Springs:** smooth(0.5, 0), snappy(0.5, 0.15), bouncy(0.5, 0.3), spring(0.55, 0.825), interactiveSpring(0.15, 0.86, 0.25). Scroll deceleration 0.998 / 0.99. Keyboard and CA 0.25s. easeInOut `cubic-bezier(0.42,0,0.58,1)`.
- **Colors:** label alphas 1.0 / 0.6 / 0.3 / 0.18, systemGray1 through 6, plain and grouped background hierarchies, systemFill alphas `#78788033` / `#7878805C`.
- **Materials:** 5 blur levels plus Regular and Clear glass. CSS glass = blur 18px, saturate 1.6, hairline stroke, top specular, outer shadow. SVG displacement for refraction with blur fallback.
- **Haptics:** impact (light/medium/heavy/soft/rigid), selection, notification (success/warning/error) mapped to interactions. Core Haptics intensity plus sharpness.
- **Sizes:** 44pt minimum target, toggle 51 × 31, control ladder mini through extraLarge, nav bar 44, large title 96, tab bar 49.
- **Component defaults:** sheet detents and corner radius, list row 44 with separator alignment guide, button style map, zoom transition namespace pattern.
