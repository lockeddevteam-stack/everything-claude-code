# LOCKED v6 — Current Design System (measured)

Source: `input/locked-current-v6.html`, 58,015 lines. All counts below are from the scripts in the Appendix. Line numbers refer to that file.

Regions used for measurement:

| Region | Lines | What |
|---|---|---|
| HEAD1 | 15–119 | theme bootstrap script (`data-style-profile`, text-size) |
| HEAD2 | 126–1217 | pre-React auth/paywall shell (HTML strings with inline CSS) |
| STYLE | 1218–1272 | the `<style>` block (55 lines) |
| CSSARR | 2268–4529 | `var CSS = [ ... ]` — 2,262 lines, 91,624 bytes, 1,151 CSS rule strings injected via `React.createElement("style", null, CSS)` at 5 sites (34028, 34233, 34339, 34448, 57738) |
| JS | 1276–2267 + 4530–58006 | app JS excluding CSSARR (comments stripped before color/emoji counts) |
| APP | 1276–58006 | JS + CSSARR |

Correction to the directive's "one 54-line style block": the real stylesheet is the 1,151-rule CSSARR. It holds all 105 `!important`s, all 51 keyframes, four extra theme palettes, and 44 rules keyed on `[style*='...']` attribute selectors that rewrite inline styles after the fact.

## 1. Token layer

### 1.1 CSS variables

Defined in three places. STYLE (1223–1233) is a partial mirror for the pre-React shell; CSSARR line 2268 is the canonical set; line 2326 adds a "Design system v3" `--ds-*` set plus three extra themes.

Dark (canonical, line 2268 `html{}`):

| Token | Value |
|---|---|
| `--color-bg` | `#000000` |
| `--color-surface` | `#0D0D0F` |
| `--color-card` | `#1C1C1E` |
| `--color-border` | `rgba(255,255,255,0.09)` |
| `--color-text` | `#F5F5F7` |
| `--color-text-muted` | `#A1A1AA` |
| `--color-text-subtle` | `#2C2C2E` |
| `--color-text-tertiary` | `#8E8E93` |
| `--color-accent` | `#F97316` |
| `--color-accent-dark` | `#7C3A0E` |
| `--color-accent-deep` | `#C2410C` |
| `--color-accent-text` | `#FB923C` |
| `--color-accent-rgb` | `249,115,22` |
| `--color-success` | `#22C55E` |
| `--color-success-deep` | `#178841` |
| `--color-error` | `#F05151` |
| `--color-info` | `#4186F6` |
| `--color-warning` | `#F59E0B` |
| `--color-feature` | `#8B5CF6` |
| `--color-macro-protein` | `#3B82F6` |
| `--color-macro-carbs` | `#F59E0B` |
| `--color-macro-fat` | `#EC4899` |
| `--color-positive-alt` | `#10B981` |
| `--color-positive-alt-deep` | `#0C875E` |
| `--color-shadow` | `rgba(0,0,0,0.5)` |
| `--color-shadow-light` | `rgba(0,0,0,0.18)` |
| `--glass-bar` | `rgba(0,0,0,0.78)` |
| `--color-fill1` / `fill2` / `fill3` | `#111113` / `#18181B` / `#2A2A2F` |

Light (line 2268 `html.light-mode, html[data-style-profile='light']{}`): `--color-bg #F2F2F7`, `--color-surface #F2F2F7`, `--color-card #FFFFFF`, `--color-border rgba(60,60,67,0.12)`, `--color-text #1C1C1E`, `--color-text-muted #5F5F66`, `--color-text-subtle #E5E5EA`, `--color-shadow rgba(15,23,42,0.10)`, `--color-shadow-light rgba(15,23,42,0.06)`, `--color-accent-text #9A3412`, `--color-warning #B45309`, `--color-success #15803D`, `--color-success-deep #15803D`, `--color-error #DC2626`, `--color-info #2563EB`, `--color-feature #6D28D9`, `--color-macro-protein #2563EB`, `--color-macro-carbs #B45309`, `--color-macro-fat #BE185D`, `--color-positive-alt #047857`, `--color-positive-alt-deep #046148`, `--color-text-tertiary #6C6C70`, `--glass-bar rgba(242,242,247,0.85)`, `--color-fill1/2/3 #E4E6E9 / #F0F2F5 / #D4D8DF`. Not overridden in light: `--color-accent`, `--color-accent-dark`, `--color-accent-deep`, `--color-accent-rgb`.

STYLE-only tokens (1228, 1233, shell): `--color-shell-bg #080809/#F2F2F7`, `--color-shell-logo #F97316/#C2410C`, `--color-shell-card #111113/#FFFFFF`, `--color-shell-fill #18181B/#E9E9EF`, `--color-error-deep #B91C1C` (dark only). STYLE omits 19 of the canonical tokens; comment at 1219–1222 asks to "keep the two in sync".

Line 2326 `--ds-*` set (dark `:root` / light / slate / navy / midnight): `--ds-grouped #000000`, `--ds-elevated #1C1C1E`, `--ds-elevated-2 #2C2C2E`, `--ds-separator rgba(84,84,88,0.34)`, `--ds-fill rgba(120,120,128,0.20)`, `--ds-fill-soft rgba(120,120,128,0.12)`, `--ds-material rgba(30,30,32,0.72)`, `--ds-t-large 2.125rem`, `--ds-t-title 1.625rem`, `--ds-t-head 1.25rem`, `--ds-t-body 1rem`, `--ds-t-sub 0.9375rem`, `--ds-t-foot 0.8125rem`, `--ds-t-cap 0.75rem`, `--ds-t-cap2 0.6875rem`, `--ds-s1..s8 4/8/12/16/20/24/32px`, `--ds-r-sm/md/lg/xl 10/14/18/22px`. Each `var(--ds-*)` is referenced 1–2 times in the whole file (all inside CSSARR classes `.ds-num`, `.ds-section-hd`, `.ds-largetitle`); none reach JS directly.

Extra themes (line 2326): `theme-slate` (bg `#0D1117`, card `#21262D`, text `#E6EDF3`), `theme-navy` (bg `#070F1E`, card `#112035`, text `#E0EFFF`), `theme-midnight` (bg `#0C0917`, card `#1C183A`, text `#EDE9FE`). Each overrides 9 `--color-*` tokens and re-declares `--ds-*`; each needs 7 further `!important` rules for body/nav/input/textarea/select. `ALL_THEME_CLASSES` at 2500. Also line 2289 redefines 6 tokens inside a `.lk-hero`-style rule (`--color-text-muted rgba(245,245,247,0.62)`, etc.) and `@media (prefers-contrast: more)` at 2326 lifts `--color-border` to `rgba(255,255,255,0.35)` and `--color-text-muted` to `#D4D4D8` (light: `rgba(60,60,67,0.60)`, `#3C3C43`).

Total `--name:value` declarations found: 176 (STYLE 26, CSSARR 150).

### 1.2 color-scheme

- `html{color-scheme:dark light;...}` and `html.light-mode{color-scheme:light}` (2268). Correct for dark-native.
- Theme chosen before React: HEAD1 line 21 reads `localStorage` then `matchMedia("(prefers-color-scheme: light)")`, sets `data-style-profile` (23) and `.light-mode` (24). Runtime switch at 2507–2519 (`applyTheme`). `theme-slate/navy/midnight` do not set `color-scheme` (inherit `dark light`).
- STYLE (1223) does not declare `color-scheme`; the shell relies on CSSARR mounting.

### 1.3 JS constants wrapping tokens (lines 1986–2115, uses counted in JS)

| Const | Value | Uses |
|---|---|---|
| `MU` | `var(--color-text-muted)` | 1048 |
| `BORD` | `var(--color-border)` | 634 |
| `TX` | `var(--color-text)` | 557 |
| `OR` | `var(--color-accent)` | 547 |
| `CARD` | `var(--color-card)` | 315 |
| `SU` | `var(--color-text-subtle)` | 219 |
| `GR` | `var(--color-success)` | 102 |
| `RE` | `var(--color-error)` | 79 |
| `BLU` | `var(--color-info)` | 53 |
| `WA` | `var(--color-warning)` | 41 |
| `SURF` | `var(--color-surface)` | 39 |
| `FAT` | `var(--color-macro-fat)` | 17 |
| `EMD` | `var(--color-positive-alt)` | 9 |
| `ORD2` | `var(--color-accent-deep)` | 9 |
| `GLASSBAR` | `var(--glass-bar)` | 8 |
| `BG` | `var(--color-bg)` | 5 |
| `ELEV` | `var(--ds-elevated)` | 5 |
| `FILL_SOFT` | `var(--ds-fill-soft)` | 6 |
| `GR_D`, `EMD_D`, `SHADOW` | success-deep, positive-alt-deep, shadow | 2, 1, 1 |
| `ORD`, `VI`, `PRO`, `CAR`, `ORTX`, `TX3`, `GROUPED`, `ELEV2`, `SEP`, `FILL`, `MATERIAL` | various | 0 each (dead) |

Hex twins that bypass tokens so an alpha byte can be appended (`OR_H + "18"`): `OR_H #F97316` 390 uses (313 with alpha suffix), `RE_H #F05151` 87 (75), `GR_H #22C55E` 61 (45), `BLU_H #3B82F6` 38 (29), `WA_H #F59E0B` 16 (11), `ORD_H #7C3A0E` 8, `EMD_H #10B981` 5, `LOCKED_BADGE #8E8E93` 3, `FAT_H #EC4899` 2; `VI_H`, `PRO_H`, `CAR_H`, `ORD2_H` 0. 483 alpha-suffix concatenations total. These do not follow theme switches (light mode keeps dark hex tints).

Scale constants defined 2037–2115: `SP{xs..xxxl}` 0 uses, `RAD{s..pill}` 0 uses, `TYPE{largeTitle..caption2}` 0 uses, `SPRING` 5 uses (2165, 9035, 11232, 53894×2), `S1..S8` 22 uses total (S6, S8 unused), `R_SM/R_MD/R_LG/R_XL` 7 uses (R_MD, R_XL unused), `T_LARGE..T_CAP2` 16 uses. Three parallel scale systems, none enforced. Total `var(--` occurrences: 138 in JS, 48 in CSSARR; token reach into JS is via the 3,697 constant references above.

## 2. Font sizes

1,965 `fontSize:` in APP + 55 `font-size:` in CSS. JS values are rem strings (root 16px; Text Size setting scales root, HEAD1 line 39). Normalized to px:

| px | rem | JS count | CSS count |
|---|---|---|---|
| 11 | 0.6875 | 557 | 6 |
| 13 | 0.8125 | 401 | 9 |
| 12 | 0.75 | 302 | 4 |
| 14 | 0.875 | 220 | 9 |
| 15 | 0.9375 | 81 | — |
| 16 | 1 | 68 | 3 (+1 `!important`) |
| 18 | 1.125 | 47 | 2 |
| 20 | 1.25 | 33 | — |
| 17 | 1.0625 | 23 | 2 |
| 22 | 1.375 | 22 | — |
| 26 | 1.625 | 16 | — |
| 12.5 | 0.7812 | 13 | — |
| 24 | 1.5 | 12 | 1 |
| 28 | 1.75 | 11 | 1 |
| 11.5 | 0.7188 | 10 | — |
| 10 | 0.625 | 9 | 8 |
| 32 | 2 | 6 | 1 `!important` |
| 13.5 | 0.8438 | 4 | — |
| 9, 30, 19, 34, 58 | | 3 each | 34: 2 |
| 40, 21 | | 2 each | — |
| 36, 38, 46, 52, 56, 64, 74 | | 1 each | 38: 1, 68: 2 |
| expressions | `p.size || T_LARGE`, `p.size || T_TITLE`, `big ? "2.75rem" : "2.125rem"`, `k === "del" ? 14 : 22`, `(p.size || 30) * 0.6 + "px"` | 5 | — |

Distinct numeric sizes: 32 in JS, 33 with CSS (68px). Top 5 (11, 13, 12, 14, 15) = 1,561 of 1,861 JS literals = 83.9%. Top 6 (+16) = 87.5%. Top 8 (+18, 20) = 91.8%. Four sub-13px sizes (9, 10, 11, 11.5, 12, 12.5) carry 894 uses = 48%. 12.5, 11.5 and 13.5 are half-pixel sizes.

Line heights (`lineHeight:` in JS, 216 uses, 15 distinct): 1.5 ×66, 1 ×42, 1.6 ×33, 1.4 ×26, 1.45 ×16, 1.55 ×10, 1.2 ×4, 1.1 ×4, 1.7 ×3, 1.8/1.3/1.25/1.15/1.05 ×2 each, plus 2 expressions — unpaired with size. CSSARR sets `p{line-height:1.6}` then later `p{line-height:1.45}` and `h1,h2{line-height:1.15}`. Letter spacing: 13 distinct (`0.08em` ×17, `0.07em` ×10, `0.06em` ×9, `0.05em` ×7, `0.04em` ×7, `0.03em` ×4, `0.1em` ×3, `0.28em`, `0.02em`, `-0.02em`, `0` ×2). `textTransform: "uppercase"` ×10. Tabular figures: 4 `fontVariantNumeric: "tabular-nums"` + 1 CSS (`.ds-num`); `className: "ds-num"` used 14 times.

Font stack: `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}` (2268). HEAD2 shell uses two other stacks (`'SF Pro Display'` ×5, plain ×4). `fontFamily: "inherit"` ×8, `FONT_D` (= `"inherit"`) ×2.

## 3. Font weights

`fontWeight:` in JS 1,213 + CSS 27:

| Weight | JS literal | JS conditional (as an outcome) | CSS |
|---|---|---|---|
| 700 | 634 + 6 (`"700"`, trailing space) = 640 | 22 | 8 |
| 800 | 299 + 1 = 300 | 10 | 5 |
| 600 | 178 + 7 = 185 | 18 | 7 |
| 900 | 15 | 0 | 6 |
| 500 | 5 | 14 | 0 |
| 400 | 13 | 22 | 1 |

Directive's "700 x640, 800 x300, 600 x185, 400 x13" confirmed exactly; it omits 900 ×15 (+6 CSS) and 500 ×5. 43 conditional weight expressions (`act ? 700 : 400` ×9, `act ? 700 : 500` ×5, `act ? 800 : 600` ×4, 33 singletons). Of 1,281 style objects with `fontSize <= 13px`, 538 (42%) set weight ≥700 — small bold caps is the dominant label style. CSSARR: `h1..h6{font-weight:700}`, `button[style*='color:#fff']{font-weight:600}`.

## 4. Spacing

### 4.1 padding (shorthand `padding:` in JS: 1,161 literal + 22 expressions; CSS 2)

182 distinct raw literals; 174 distinct after canonicalising to 4 sides (`"12px 12px"` = `"12px"`). Top 20:

`16px` 100 · `12px` 100 · `8px 12px` 97 · `12px 16px` 80 · `8px` 57 · `8px 16px` 41 · `12px 12px` 33 · `0` 30 · `8px 4px` 27 · `4px 8px` 24 · `8px 8px` 24 · `52px 20px 16px` 22 · `20px` 21 · `0 20px` 20 · `12px 14px` 18 · `2px 8px` 17 · `16px 16px` 15 · `8px 0` 13 · `16px 20px` 13 · `13px` 13.

Odd values in use: `13px` 13, `14px 15px` 12, `11px` 10, `15px` 8, `11px 13px` 4, `11px 14px` 4, `13px 14px` 5, `13px 16px` 5, `3px 9px` 3, `9px` 4. Page-header padding is `52px 20px 16px` (22) / `52px 20px 0` (4) / `52px 20px 20px` (2) then rewritten by CSSARR `.lk-page [style*='padding: 52px ']{padding-top:max(...)!important}`. On 4px grid (all sides in 0/4/8/12/16/20/24/32): 816 of 1,161 = 70.3%. Strict 8px grid: 298 = 25.7%.

Side props (`paddingTop/Bottom/Left/Right`): 43 distinct, `paddingBottom: 24` 28, `paddingBottom: 40` 7, `paddingBottom` calc with `env(safe-area-inset-bottom)` 10, `paddingBottom 88/90/110/160` for nav clearance 4.

### 4.2 gap (JS 608 numeric + 5 `S2/S3`; CSS 6 rules)

17 distinct: `8` 317 · `12` 86 · `4` 83 · `6` 30 · `10` 20 · `2` 16 · `5` 14 · `16` 13 · `7` 12 · `3` 4 · `14` 4 · `9` 4 · `0` 2 · `11` 1 · `1` 1 · `24` 1 · `"4px 12px"` 1. On 4px grid 502/608 = 82.6%; on 8px grid 333 = 54.8%. Directive's 16 → 17 (18 with CSS `6px 14px`).

### 4.3 margin

Shorthand `margin:` 166 uses, 29 distinct (`0` 90, `2px 0 0` 11, `0 0 4px` 11, `0 auto` 9, `0 0 8px` 6, negatives `-16px 0 6px`, `-24px 0 8px`, `0 -20px`). Side props 1,068 uses, 88 distinct raw: `marginBottom: 8` 364, `16` 131, `12` 103, `4` 89, `marginTop: 8` 71, `2` 58, `1` 46, `4` 33, `marginBottom 10` 26, `14` 17, `18` 9, `20` 11, `6` 12, `7` 6, `3` 5, `9` 7, `11` 4. On 4px grid 807/1,068 = 75.6%; on 8px 553 = 51.8%.

Aggregate spacing atom histogram (all padding/gap/margin numbers): 8 ×1229, 12 ×695, 16 ×538, 0 ×458, 4 ×371, 20 ×199, 2 ×188, 10 ×127, 14 ×118, 6 ×84, 1 ×64, 24 ×59, 52 ×40, 13 ×38, 7 ×37, 9 ×34, 11 ×33, 3 ×32, 5 ×29, 18 ×25, 15 ×23, 32 ×21, 40 ×20 — 41 distinct integers.

## 5. Border radius

`borderRadius:` JS 1,125 literal + 9 expressions; CSS 25 declarations (incl. `!important` overrides).

| Value | Uses |
|---|---|
| 10 | 185 |
| 9 | 141 |
| 12 | 122 |
| 13 | 92 |
| 8 | 92 |
| 14 | 77 |
| 50% | 64 |
| 11 | 60 |
| 6 | 54 |
| 16 | 53 |
| 7 | 25 |
| 20 | 23 |
| 4 | 23 |
| 999 | 22 |
| 3 | 22 |
| 1 | 19 |
| 2 | 14 |
| 5 | 11 |
| `22px 22px 0 0` | 5 |
| 18 | 4 |
| 99 | 4 |
| `20px 20px 0 0` | 3 |
| 15 | 3 |
| 24, `24px 24px 0 0`, `18px 18px 0 0`, `0 0 20px 20px`, `8px 0 0 0`, `3px 0 0 3px`, `0 3px 3px 0` | 1 each |
| expressions | `R_LG` 3, `R_SM` 2, `R_SM - 3` 1, `p.radius \|\| R_LG` 1, chat-bubble ternary `16px 16px 4px 16px` 2 |
| `borderTopLeftRadius/…: 18` | 2 |

30 distinct literal values (22 uniform integers + 50% + 7 asymmetric). Directive's 24 → 30. Every integer 1–16 except none missing appears; 9/10/11 and 12/13/14 are used as if interchangeable. CSSARR then remaps them: `button[style*='border-radius: 9px'],…10px,…11px{border-radius:12px!important}`, `…12/13/14px{14px!important}`, card `[style*='background: var(--color-card)'][style*='border-radius: 12px|13px|14px|16px']{16px!important}`, `[style*='border-radius: 22px 22px 0px 0px'],[…24px…]{24px 24px 0 0!important}`, inputs `{border-radius:12px!important}`, gradient buttons `{14px!important}`. So the radius the user sees is not the radius in the JS.

## 6. Colors

### 6.1 Hex literals in JS (comments stripped, CSSARR excluded)

57 distinct strings (54 distinct base colors; 3 appear also with alpha suffix), 365 occurrences. Directive's 57 confirmed. Classification (Tailwind v3 palette / Apple system / other):

| Hex | Uses | Class | Where |
|---|---|---|---|
| `#FFF`/`#fff` | 188 | basic white | `color: "#fff"` on filled buttons |
| `#9A3412` | 66 | Tailwind orange-800 | second stop of every accent gradient (`linear-gradient(135deg,var(--color-accent-deep),#9A3412)`) |
| `#16A34A` | 7 | Tailwind green-600 | success gradient stop |
| `#3B82F6` | 7 | Tailwind blue-500 | |
| `#8B5CF6` | 5 | Tailwind violet-500 | |
| `#F59E0B` | 5 | Tailwind amber-500 | |
| `#F97316` | 5 | Tailwind orange-500 (accent) | |
| `#080809` | 4 | other | shell dark |
| `#22C55E` | 4 | Tailwind green-500 | |
| `#7C3A0E` | 4 | other (near orange-900) | |
| `#7C3AED` | 4 | Tailwind violet-600 | |
| `#06B6D4`, `#0EA5E9` | 3, 3 | Tailwind cyan-500, sky-500 | |
| `#4CAF50` | 3 | Material green-500 | ShoppingTab 43096 |
| `#52525B`, `#D97706`, `#DC2626`, `#EA580C` | 3 each | Tailwind zinc-600, amber-600, red-600, orange-600 | |
| `#F05151` | 3 | other (custom error) | |
| `#000`, `#0A0A0B`, `#1A0A02` | 2 each | basic / other darks | |
| `#2563EB`, `#6B7280`, `#E5E7EB`, `#EAB308` | 2 each | Tailwind blue-600, gray-500, gray-200, yellow-500 | |
| `#0D9488`, `#10B981`, `#14B8A6`, `#1D4ED8`, `#1F2937`, `#374151`, `#4B5563`, `#60A5FA`, `#64748B`, `#C084FC`, `#C2410C`, `#EC4899`, `#EF4444` | 1 each | Tailwind teal-600, emerald-500, teal-500, blue-700, gray-800, gray-700, gray-600, blue-400, slate-500, purple-400, orange-700, pink-500, red-500 | |
| `#8E8E93` | 1 | Apple systemGray | LOCKED_BADGE |
| `#0071CE`, `#E02020`, `#CC0000`, `#1A8A1A`, `#8B0000`, `#FF6900`, `#5C4033`, `#00695C`, `#1A237E`, `#6A0572` | 1 each | other (retailer brand palette) | `STORE_PALETTE` 42025 |
| `#0C6E38`, `#7C5CE8`, `#E5484D`, `#FF6B35` | 1 each | other (custom: coach gradient, cycle luteal, cycle menstrual, meal breakfast) | 51042, 21850, 21847, 38888 |

Tally: Tailwind 33 distinct, Apple 1, basic white/black 2, other 18. In JS the Apple grays live only in tokens; the page-level hex is Tailwind. CSSARR adds 75 distinct hex (Apple grays `#1C1C1E` ×12, `#F2F2F7` ×9, `#2C2C2E`, `#8E8E93`, `#EFEFF4`, `#C8CDD6`, plus the four theme palettes). APP total: 112 distinct hex, 504 occurrences. HEAD2 shell: 10 distinct hex (copies of tokens, `#EF4444`, `#10B981`).

Hidden hex: 483 further color values are built at runtime by `OR_H + "18"` etc. (Section 1.3) — these are hex colors the regex cannot see.

### 6.2 rgba()/rgb() literals

JS: 32 distinct, 62 uses. `rgba(0,0,0,0.55)` 6, `rgba(0,0,0,0.6)` 6, `rgba(0,0,0,0.7)` 5, `rgba(0,0,0,0.3)` 4, `rgba(0,0,0,0.4)` 4, `rgba(0,0,0,0.35)` 3, `rgba(var(--color-accent-rgb),…)` 3, `rgba(239,68,68,x)` 5 across 4 alphas (Tailwind red-500, not the `#F05151` error token), `rgba(249,115,22,0.28/0.4)` 2, `rgba(255,255,255,0.08–0.8)` 9 across 7 alphas, `rgba(0,0,0,0.001)` 1 (tap-highlight hack), `rgba(8,8,9,0.98)`, `rgba(30,30,32,0.86)`, `rgba(245,245,245,0.82)`. Black scrims use 14 distinct alphas (0.001–0.72).

CSSARR + STYLE: 73 distinct, 104 uses. Union of JS and CSS: 100 distinct, 166 uses. Directive's 115 is between "JS+CSS distinct" (100) and total; corrected to 100 distinct / 166 uses.

### 6.3 Named colors and var()

`none` 535 (borders/backgrounds), `transparent` 89, `currentColor` 1. `var(--…)` literal in JS: 138; in CSSARR: 48. Token-backed constant references in JS: 3,697. So ≈3,835 tokened color uses vs 365 hex + 483 concat-hex + 62 rgba = 910 non-token color uses in JS (19%).

## 7. Shadows

`boxShadow:` JS 18 uses, 15 distinct (11 string literals + 4 expressions). CSSARR 15 distinct declarations. Union 25.

JS: `0 2px 8px var(--color-shadow-light)` 2 · `0 8px 32px rgba(0,0,0,0.4)` 2 · `"0 0 48px " + hex` 2 · `0 18px 50px rgba(0,0,0,0.55)` · `0 6px 18px rgba(0,0,0,0.35)` · `0 4px 14px rgba(249,115,22,0.28)` · `0 4px 16px rgba(0,0,0,0.3)` · `0 4px 12px rgba(0,0,0,0.15)` · `0 4px 14px var(--color-shadow)` · `"0 0 60px " + hex` · `"0 0 32px " + hex` · `act ? "0 1px 4px rgba(0,…)"` · `dragging ? "0 10px 30px rgba(0,…)"` · `isActive ? "0 0 0 1px " + OR_H` · `on ? "0 1px 3px " + SHADOW : "none"` (DsSegmented).

CSSARR: `button[style*='color:#fff']{box-shadow:0 4px 12px rgba(0,0,0,0.3)}` and `:hover{0 8px 24px rgba(249,115,22,0.25)}`; `button:active{0 1px 4px var(--color-shadow)}`; `[style*='box-shadow: 0 1px']:not(…){0 1px 2px var(--color-shadow-light), 0 6px 20px var(--color-shadow)!important}`; `button[style*='linear-gradient']{0 2px 6px rgba(249,115,22,0.25),0 8px 22px rgba(249,115,22,0.22)!important}`; `inset 0 1px 0 rgba(255,255,255,0.04)` ×2; glow keyframes `0 0 20/30/40/60px rgba(249,115,22,0.4–0.85)`. `textShadow` 1 (intro), `drop-shadow(` 5. Directive's 11 → 15 in JS, 25 with CSS.

## 8. Transitions, durations, easings, keyframes

`transition:` JS 90 uses (81 string literals of 45 distinct + 9 expressions), CSSARR 4 rules. Union 49 distinct strings. Top: `"background .2s"` 8 · `"left .2s"` 8 · the six-property `background-color 0.2s ease,border-color…,box-shadow 0.2s ease` 6 (same string at 0.15s ×4, 0.18s ×3, .2s ×2, .25s ×1, 0.3s ×1 = 17 variants of one idea) · `"transform .25s ease"` 4 · `"width .3s"` 4. Also `PRESS_EASE` (10258) sets `transform 420ms`/`260ms` inline via `el.style.transition`.

Durations across transitions (25 distinct spellings, 15 distinct values): .2s/0.2s 85 · 0.18s/.18s 21 · 0.15s/.15s 32 · .25s/0.25s 15 · 0.3s/.3s 16 · 0.24s/.24s 9 · 0.45s 5 · 0.5s/.5s 7 · 0.35s/.35s 3 · 0.4s/.4s 3 · 0.65s 2 · .26s · .34s · .38s · .42s · 0.85s. Easings: `ease` 150 · `ease-out` 3 · `cubic-bezier(0.25,0.8,0.35,1)` 3 · `cubic-bezier(0.25,1,0.5,1)` 2 · `cubic-bezier(0.3,0.75,0.25,1)` 1 · `linear` 1; plus `PRESS_EASE` = `linear(0,0.0864,…,1)` spring with `cubic-bezier(0.32,0.72,0,1)` fallback. Animations add `cubic-bezier(0.32,0.72,0,1)` ×8, `(0.22,1,0.36,1)` ×2, `(0.34,1.3,0.64,1)` ×2, `(0.25,0.46,0.45,0.94)`, `(0.4,0,1,1)`, `step-end`. `SPRING` object (2067) drives 4 JS rAF springs (sheet, snap ×3) — the only spring physics; `SPRING.press`/`reflow` unused.

`animation:` JS 64 distinct strings (e.g. `pulse` at 1s/1.2s/1.4s/2s, `fadeUp` at .18/.25/.3/.35/.4s with 4 easings, `spin` 0.7s and 0.8s).

Keyframes: 51 `@keyframes` names, all in CSSARR (2297–2317, 2326). Directive's 24 → 51. `fadeUp`, `pulse`, `slideUp`, `slideUpCentered`, `slideDownBanner`, `slideFromTop`, `shimmer`, `tutFadeIn`, `tutFadeUp`, `tutIconIn`, `tutPulseGlow`, `tutGridMove`, `tutCursor`, `tutCircleDraw`, `tutCheckDraw`, `lockBodyIn`, `lockShackleRotate`, `lockShackleOpen`, `lockRingExpand`, `lockRingExpand2`, `lockFinalGlow`, `tutButtonGlow`, `tutP1`…`tutP12`, `scalePopOut`, `ceGlow`, `ceSegIn`, `bubblePop`, `bubbleRise`, `bubbleOut`, `veilIn`, `glowPulse`, `checkPulse`, `jiggle`, `partialsFlash`, `spin`, `progressArc`, `overlayIn`, `pillIn`, `cardRise`, `dotSpring`. Referenced outside their definition: `pulse` 18, `spin` 16, `fadeUp` 10, `slideUp` 6, `tutFadeUp` 6; 6 are defined and never used (`shimmer`, `tutCircleDraw`, `tutCheckDraw`, `lockShackleOpen`, `checkPulse`, `progressArc`, `dotSpring` = 7). 27 of 51 (`tut*`, `lock*`) belong to TutorialOverlay/intro alone. `@media (prefers-reduced-motion:reduce)` (2326) zeroes all animation/transition with 15 `!important`s.

## 9. Gradients

`linear-gradient(` 140, `radial-gradient(` 6, `conic-gradient(` 0 → 146 total on 141 lines, 0 in CSSARR (2 radial in HEAD2 shell, 144 in JS). Directive's 142 confirmed as ~142 linear (140 exact).

Classification method: for each gradient line, look at ±5 lines. `scrim/mask` if the gradient fades to `transparent` and the context has mask/overlay/fade (header tints `linear-gradient(180deg, hex+"18" 0%, transparent 100%)`, DsHeader `p.tint`). `functional` if the context mentions progress/pct/percent/ratio/chart/ring/meter/track/stripe or computes a `%` width — but see caveat. Otherwise `decorative`.

Result: functional 68, decorative 65, scrim/mask 13. Caveat: the "functional" bucket is inflated — the accent button fill `linear-gradient(135deg,var(--color-accent-deep),#9A3412)` (66 occurrences, the single most common gradient) is matched as functional whenever the surrounding button is disabled by a `.trim()`/length check; it is decorative. Manual reclassification: decorative ≈ 120 (66 accent-button fills + `135deg OR_H→#EA580C/#7C3A0E/ORD_H` variants + card tints + `90deg transparent→RE_H` swipe-delete trails), scrim/mask 13, functional ≈ 13 (progress bars with computed widths, McRing/CeTierMeter, striped fills). Only `[style*='linear-gradient']` buttons get `border-radius:14px!important` and an orange double shadow from CSSARR — the gradient is being used as a "primary button" selector.

## 10. `!important` and emoji

`!important`: 105 total; 105 in CSSARR, 0 in STYLE, 0 in JS, 0 in HEAD. Of the 53 CSSARR rule strings carrying them: 59 occurrences inside `[style*=…]` attribute-selector rewrites, 28 inside theme/light-mode overrides, 15 inside `prefers-reduced-motion`, 3 elsewhere. Directive's 105 confirmed.

Emoji in rendered string literals (JS, comments excluded — 0 emoji in comments):

- Pictographic emoji typed literally: 93 occurrences, 52 distinct code points. Count of 52 distinct: ✓ 10, ⚖ 3, ✕ 3, 🍗 3, 🏋 3, 🔥 3, 😐 3, 😕 3, 🥦 3, ★ 2, ☆ 2, ⭐ 2, 🍠 2, 🎯 2, 🐟 2, 💊 2, 💧 2, 💪 2, 📐 2, 😊 2, 😞 2, 🥑 2, 🥚 2, 🥛 2, 🥩 2, and 1 each: ⏹ ☐ ☑ ✎ ✗ ✨ 🌅 🌙 🍚 🍽 🍿 🎙 🏃 🏆 🏪 💤 📋 📦 🗄 😣 😫 😴 🛒 🥜 🥣 🧀 🧾.
- Same emoji written as `\uD83x\uDxxx` escapes: 26 more (📝 ×5, 🎯 ×3, 💉 ×3, 📋 ×2, 🗄 ×2, 🏋 ×2, 💡, 😴, 📐, 🛒, 💰, 💊, 🍽, 🧠, 📍). Lines: 9608, 9766, 12307, 13787, 16223, 17961, 18137, 18296, 28122, 28298, 33650, 41258, 42634, 43792, 46051, 46071, 46227, 47378, 48682, 48746, 51739, 51868, 51962, 54858, 55479, 55505.
- Dingbat escapes: `✓` ✓ 7, `★` ★ 6, `✕` ✕ 3, `☆` ☆ 3, `⏱` ⏱ 2, `➕` ➕ 2 (23).

Total emoji glyphs rendered: 119 pictographic (93 + 26) + 23 escaped dingbats — 142 symbol/emoji occurrences; 119 if escaped dingbats are excluded (25 literal dingbats ✓✕★☆☐☑✎✗⏹ are inside the 93). Directive's 65 → 119 occurrences, 58 distinct glyphs (52 literal + 6 escape-only). By component: DynamicFeed 17 (mood/sleep/energy scales 18210–18252), ShoppingTab 13, CoachScreen 13, top-level data tables 27 (QuickActionsRow icons 26084–26119, STORE categories 42605–42610, fitness picks 45908–45963, supplement timing 46890), SupplementsTab 5, BetaAdminPanel 5, Home cards (📝 on ThrowbackCard/ProactiveTipCard/insight), WorkoutLog 2, SplitBuilder 2, PlateCalc 2, GoalsTab 2, CycleTab 2.

## 11. Icons

- One SVG icon component: `Ic(p)` at 5234 (`IcMemo` 5255). 249 `createElement(Ic` calls. Props: `d` (path or array from map `D`, 5281–5331, 45 named paths + 11 inline path strings), `z` size (default 20), `w` strokeWidth (default 1.8), `c` stroke color, `f` fill, `a` aria-label. `viewBox 0 0 24 24`, `strokeLinecap/Join round`.
- Stroke weight in practice: 247 of 249 use the default 1.8; one 2.6, one 1.4. Other inline SVGs (19 `createElement("svg"` total, 8 with the 24×24 box) use `strokeWidth` 2.5 ×5, 2 ×4, 11 ×3 (rings), 4, 8, 1.5, 1.6, 0.7, 1, 2.2, plus 2 raw `<svg stroke-width="2">` in HEAD2. 15 distinct stroke widths file-wide; icon set effectively one weight, decorative SVGs another six.
- Optical size: 23 distinct `z` values — 14 ×44, 16 ×36, 13 ×30, 22 ×24, 18 ×24, 15 ×15, 12 ×15, 20 ×14, 17 ×13, 11 ×13, 10 ×6, 26 ×3, 28 ×2, 8/9/19/21/24/30/32/36/44/52 ×1. No shared size scale.
- Most used glyphs: `D.back` 36, `D.x` 21, `D.check` 21, `D.chev` 20, `D.ai` 20, `D.plus` 19, `D.train` 15, `D.trash` 10, `D.edit` 8. Dynamic lookups `D[a.icon] || D.bolt` ×6 (cardio activities: `bolt` 12, `bike` 9, `run` 8, `stairs` 7, `ball` 6, `mountain` 6, `rower` 5, `swim` 4, `climb` 3).
- Emoji as icons: 27 lines pass an emoji string through an `icon:`/`emoji:` prop (`icon: "💧"`, `"🍗🥦"`, etc. — QuickActionsRow, store categories, fitness picks, supplement timing). Also `LoadingSpinner` (5256) is a pulsing dot, not an icon.
- No `Icon*`-named components exist; icon = `Ic` + emoji + 11 ad-hoc inline SVG paths.

## 12. Components

Method: `^function [A-Z]\w*\(` or `^(var|const) [A-Z]\w* = (…|function|React.memo)` at column 0 in JS; body = to next column-0 statement; `ce` = `React.createElement(` count in body, `st` = `style: {` count. 109 top-level matches; 107 render at least one element; `IcMemo`/`LoadingMemo` are memo wrappers, so 107 real components (directive: 111; a count that also takes inner functions `Pill`, `Section`, `Btn`, `optBtn` reaches 111). Nested/inner: `Pill` 14911, `Section` 14940, `Btn` 22776 (McOnboarding), `optBtn`, `API` 1305, `PRESS_EASE` 10258, `SAFE_B` 53796 are not components. File totals: `React.createElement(` 4,407 (directive 4,408); `style: {` 3,719 (matches); 597 `createElement("button"` + 24 `role: "button"`; `"aria-label"` 193; `role:` 103.

| Line | Component | ce | st | | Line | Component | ce | st |
|---|---|---|---|---|---|---|---|---|
| 10013 | WorkoutLog | 246 | 206 | | 20039 | RecipeLogSheet | 18 | 18 |
| 32031 | SettingsScreen | 186 | 167 | | 53718 | VoiceButton | 18 | 17 |
| 49915 | CoachScreen | 185 | 167 | | 39088 | ManualEntry | 17 | 15 |
| 47432 | CycleTab | 150 | 123 | | 22596 | CycleTrackerCard | 15 | 14 |
| 26992 | GoalsTab | 139 | 117 | | 4664 | ThrowbackCard | 14 | 14 |
| 29165 | PRHub | 125 | 100 | | 21550 | FuelDisplayCard | 14 | 12 |
| 56343 | CardioLogFlow | 111 | 81 | | 53210 | RefeedCard | 14 | 12 |
| 43974 | BudgetTab | 108 | 94 | | 53312 | WeightLogCard | 14 | 13 |
| 25108 | CycleTrackerScreen | 107 | 79 | | 9847 | NumPad | 13 | 13 |
| 15013 | TrainHub | 103 | 76 | | 24501 | McRecoveryCard | 13 | 12 |
| 37469 | MealPlanFuelTab | 103 | 92 | | 36538 | WaterCard | 13 | 13 |
| 30585 | ProgressPhotos | 101 | 78 | | 14881 | AdaptiveTrainingCard | 12 | 11 |
| 40760 | RecipesTab | 100 | 85 | | 49400 | CoachCardioCard | 12 | 11 |
| 7761 | ExLib | 99 | 75 | | 46185 | SuppReminderCard | 11 | 9 |
| 28323 | ProgressPage | 98 | 78 | | 47334 | CycleReminderCard | 11 | 9 |
| 42420 | ShoppingTab | 93 | 78 | | 56216 | CardioSection | 11 | 7 |
| 39355 | SearchTab | 88 | 77 | | 19693 | DayNutritionPanel | 10 | 10 |
| 33808 | Onboarding | 87 | 75 | | 21678 | PrivacyCard | 10 | 9 |
| 13956 | AISplitBuilder | 81 | 70 | | 22417 | McRing | 10 | 4 |
| 17084 | WorkoutDetail | 81 | 68 | | 24405 | McHealthCard | 10 | 9 |
| 26220 | HomeScreen | 80 | 59 | | 24654 | McTrainingCard | 10 | 9 |
| 46278 | SupplementsTab | 80 | 63 | | 24777 | McNutritionCard | 10 | 8 |
| 35794 | FuelProfileSetup | 71 | 61 | | 43542 | RunningLowCard | 10 | 9 |
| 45234 | MealPlannerTab | 70 | 57 | | 7496 | ExerciseActionSheet | 9 | 8 |
| 23147 | McLogSheet | 60 | 54 | | 21751 | TdeeReportCard | 8 | 7 |
| 15965 | Review | 59 | 56 | | 24587 | McEcCard | 8 | 6 |
| 8782 | SplitBuilder | 56 | 48 | | 18441 | **DsHeader** | 7 | 7 |
| 36895 | FuelTab | 55 | 34 | | 26141 | QuickActionsRow | 7 | 7 |
| 54925 | PlateCalc | 54 | 47 | | 49455 | CoachSetupSection | 7 | 6 |
| 54228 | TutorialOverlay | 52 | 44 | | 17858 | ProactiveTipCard | 6 | 6 |
| 22751 | McOnboarding | 51 | 37 | | 31987 | StorageCard | 6 | 6 |
| 20859 | BarcodeTab | 50 | 46 | | 7118 | ExerciseNotes | 5 | 5 |
| 38554 | ListTab | 49 | 46 | | 7652 | Nav | 5 | 4 |
| 52806 | BetaAdminPanel | 49 | 43 | | 18530 | **DsRow** | 5 | 4 |
| 55924 | CardioHistory | 48 | 47 | | 18610 | **DsStat** | 5 | 4 |
| 16622 | ConvertToSplitModal | 45 | 45 | | 31945 | TextSizeCard | 5 | 5 |
| 30153 | ProfileScreen | 44 | 39 | | 48843 | Placeholder | 5 | 4 |
| 7202 | ExerciseDetailModal | 43 | 40 | | 18489 | **DsSection** | 4 | 3 |
| 17998 | DynamicFeed | 43 | 38 | | 20800 | QuickChip | 4 | 4 |
| 57186 | App | 43 | 19 | | 25064 | McTrainBanner | 4 | 2 |
| 20275 | RecipeBuilder | 40 | 38 | | 5234 | Ic | 3 | 0 |
| 43578 | PantryTab | 36 | 35 | | 5256 | LoadingSpinner | 3 | 3 |
| 49483 | CoachSetupPane | 36 | 32 | | 35763 | MacroRing | 3 | 1 |
| 52547 | FeedbackScreen | 35 | 33 | | 18573 | **DsSegmented** | 2 | 1 |
| 40360 | PhotoTab | 33 | 28 | | 55510 | CardioStar | 2 | 2 |
| 23754 | McCalendar | 31 | 30 | | 57053 | CeTierMeter | 2 | 2 |
| 42079 | MyStoresTab | 30 | 27 | | 5085 | DraftNum | 1 | 0 |
| 55550 | CardioFavorites | 30 | 26 | | 18513 | **DsCard** | 1 | 0 |
| 24066 | McSettings | 29 | 27 | | 53700 | VoiceButtonWrap | 1 | 0 |
| 31756 | NotificationsCard | 26 | 26 | | 57020 | CeCount | 1 | 0 |
| 49750 | CoachInterview | 24 | 22 | | 5255 | IcMemo (memo) | 0 | 0 |
| 31492 | LayoutEditor | 23 | 22 | | 5280 | LoadingMemo (memo) | 0 | 0 |
| 8625 | ReplacePanel | 22 | 18 | | | | | |
| 19781 | TrendsTab | 21 | 14 | | | | | |
| 45968 | ShoppingBudgetTab | 20 | 15 | | | | | |
| 24915 | McFuelStrip | 19 | 18 | | | | | |
| 36671 | SmartNutritionCard | 19 | 18 | | | | | |

Workout Log page as bounded (10013–13955): 3,943 lines, 246 createElement, 206 style objects — confirms the directive.

### 12.1 Ds* primitives (18441–18648) — defined, effectively unused

| Primitive | Line | Props | States | Call sites outside definition |
|---|---|---|---|---|
| `DsHeader` | 18441 | `top` (default 52), `bottom` (S4), `tint` (hex → `linear-gradient(180deg, tint+"14", transparent)`), `eyebrow`, `title`, `size`, `subtitle`, `actions`, `children` | none | 1 (25332, CycleTrackerScreen) |
| `DsSection` | 18489 | `title`, `action`, `footnote`, `gap` (S5), `children` | none | 0 |
| `DsCard` | 18513 | `tone` ("soft" → FILL_SOFT, else ELEV), `radius` (R_LG=18), `pad` (S4), `accent` (border), `onClick` (adds role=button, tabIndex, keyboard), `style` | clickable/static | 0 |
| `DsRow` | 18530 | `leading`, `label`, `detail`, `value`, `valueColor`, `trailing`, `dense` (38px vs 48px min-height), `strong`, `onClick`, `style` | clickable/static, dense | 0 |
| `DsSegmented` | 18573 | `label` (aria), `options[{id,label}]`, `value`, `onChange`, `style`; `role=tablist`/`tab`, `aria-selected` | selected (ELEV bg, TX, 600, `0 1px 3px` shadow) / idle (transparent, MU, 500); transition `background .18s ease,color .18s ease` | 1 (19815, TrendsTab) |
| `DsStat` | 18610 | `label` (T_CAP2 uppercase 0.05em), `value` (T_TITLE 800, `ds-num`), `size`, `color`, `unit`, `detail`, `style` | none | 0 |

No pressed/disabled/loading/empty states on any primitive. Total Ds* usage: 2 call sites in 58k lines. They are a seed, not a library. Other repeated ad-hoc primitives: `Btn` (McOnboarding, 5 uses, gradient fill, radius 12, weight 800), `RCard` 3, `ExBtn` 2, `Placeholder` 0, `QuickChip` 0 (rendered via map), `Pill`/`Section` (AdaptiveTrainingCard, called as functions).

### 12.2 Competing tab / segmented patterns

`role: "tablist"` appears 4 times; `role: "tab"` 4; `aria-selected` 4. Other tab rows are plain `button`s in a flex row.

| # | Location | Container | Item | Selected style |
|---|---|---|---|---|
| A | `DsSegmented` 18573 | FILL_SOFT, radius `R_SM`=10, pad 2, gap 2 | pad `7px 10px`, radius `R_SM - 3`=7, 13px, 500 | ELEV bg, TX, 600, shadow |
| B | ProgressPage 28611 | none (pill row), `padding: 0 20px` | pad `8px 16px`, radius **20**, 13px, 600 | `OR` filled, white text |
| C | ShoppingBudgetTab 46094 | `SU` bg, radius **12**, pad 4 | pad `8px 4px`, radius **9**, 12px, 700 | `CARD` bg, 6-prop 0.2s transition |
| D | CoachScreen 50903 | `SURF` bg, radius **12**, pad 4 | pad `12px 8px`, radius **9**, 12px, `act ? 700 : 500`, 7px dot indicator | `CARD` bg, 0.18s transition |
| E | Pill rows with `borderRadius: 999` (22 sites: TrainHub 15751, WorkoutLog 13002, CoachScreen ×3, ExerciseActionSheet ×2, CardioFavorites/History/LogFlow, PhotoTab ×2, PantryTab, StorageCard ×2, CoachSetupPane, CoachSetupSection, FeedbackScreen, SmartNutritionCard, AdaptiveTrainingCard, QuickChip, CeTierMeter) | none | radius 999 chips | `OR_H + "18"` tint + `OR_H` border, or `OR` filled |
| F | Nav 7652 | `nav` glass bar, CSSARR `nav button:active{scale(0.92)}` | icon + label, `aria-current` | accent color |

Radii used for tab items: 7, 9, 20, 999 (containers 10, 12). Directive's "three competing tab patterns with radii from 8 to 999" → at least four segmented implementations (A–D) plus pill chips (E), radii 7–999; the 8 in the directive is not present as a tab radius (9 is).

## 13. Sprawl table — confirmed / corrected

| Metric | Directive says | Measured | Delta / notes |
|---|---|---|---|
| Font sizes | 34 (5 cover 88%) | 32 distinct px in JS (33 with CSS `68px`); top 5 = 83.9%, top 6 = 87.5% | Confirmed within 1–2; "5 cover 88%" is really 6 cover 87.5%. 1,861 JS literals; 48% are ≤12.5px |
| Font weights | 700 ×640, 800 ×300, 600 ×185, 400 ×13 | 700 ×640, 800 ×300, 600 ×185, 400 ×13 (literal JS incl. quoted/space variants); plus **900 ×15**, **500 ×5**, and 43 conditional expressions | Confirmed exactly; add 900 and 500 (6 weights in use, not 4) |
| Border radii | 24 | **30** distinct literal values in JS (22 integers + 50% + 7 asymmetric), 1,125 uses; CSSARR then remaps 9–16 to 12/14/16 with `!important` | Corrected upward |
| Padding combos | 194 | **182** distinct raw literals, 174 canonical, +18 expressions (=200 raw incl. expressions), 1,183 uses; 70% on 4px grid, 26% on 8px grid | Directive's 194 sits between literal (182) and literal+expr (200); use 182 |
| Gap values | 16 | **17** literal in JS (+`S2`,`S3`; +1 CSS `6px 14px` = 18) | Confirmed ±1 |
| Hex colors in JS | 57 (Tailwind and Apple mixed) | **57** distinct strings / 54 base colors, 365 uses; 33 Tailwind, 1 Apple, 18 other (10 retailer brand), 2 basic; **+483 runtime hex via `_H + "xx"` concat**; CSSARR adds 75 distinct (Apple grays live there) | Confirmed exactly; "Apple palette" is in CSS/tokens, JS hex is Tailwind + brand |
| rgba literals | 115 | **32 distinct / 62 uses in JS; 73 distinct / 104 uses in CSSARR; union 100 distinct, 166 uses** | Corrected: 100 distinct (115 was neither distinct nor total) |
| Box shadows | 11 | **11 JS string literals** + 4 conditional = 15 JS; 15 CSSARR; union 25 | Confirmed for JS literals; whole system is 25 |
| Transition variants | 45 | **45 distinct JS literal strings** (81 uses) + 9 expressions + 4 CSS = 49 distinct; 15 distinct durations, 6 easings (+1 spring) | Confirmed exactly for JS literals |
| Keyframes | 24 | **51** `@keyframes` (all in CSSARR); 27 are `tut*`/`lock*` for TutorialOverlay; 7 unused | Corrected: 51 |
| linear-gradient | 142 | **140** linear + 6 radial = 146; 0 in CSSARR; ≈120 decorative (66 are one accent button fill), 13 scrims, ≈13 functional | Confirmed (−2); decorative share ≈ 82% |
| !important | 105 | **105**, all in CSSARR (59 in `[style*=]` rewrites, 28 theme/light, 15 reduced-motion) | Confirmed exactly |
| Emoji in UI | 65 | **119** pictographic emoji occurrences (93 literal + 26 `\uD83x` escapes), 58 distinct; +23 escaped dingbats (✓★✕☆…) = 142 symbol glyphs | Corrected: 119 (escaped forms were missed) |
| — | `<style>` "54 lines" | STYLE is 55 lines, but `var CSS` (2268–4529) is 2,262 lines / 91.6 KB / 1,151 rules, 44 of them `[style*=…]` attribute rewrites | Add to build facts |
| — | 111 components | 107 rendering top-level components (109 matches incl. 2 memo wrappers); 4,407 createElement; 3,719 style objects | Confirmed ±4 |
| — | Ds* primitives as library seed | 6 defined, **2 call sites total** (DsHeader ×1, DsSegmented ×1) | Seed only; no pressed/disabled states |

## Appendix — reproduction

All run from `/home/user/everything-claude-code/redesign/input` with `F=locked-current-v6.html`.

```
# regions
grep -n '<style\|</style>\|<script\|</script>' $F | head -30
awk 'NR>2268 && /^\];?\s*$/ {print NR; exit}' $F          # CSS array end → 4529
grep -n 'color-scheme' $F

# 1 tokens / constants
grep -oE '(--[a-zA-Z0-9-]+)\s*:\s*[^;}"]+' $F | wc -l      # 176
sed -n '1955,2130p' $F                                    # BG..T_CAP2, SP/RAD/TYPE/SPRING/S*/R_*
python3: for each const name N: len(re.findall(r'(?<![\w$.])N(?![\w$])', JS)) - 1

# 2 font sizes (JS rem→px; T_* mapped to their rem values)
grep -o 'fontSize: [^,}]*' $F | sort | uniq -c | sort -rn
python3: fs[round(float(rem)*16,2)] += 1 for 'fontSize:\s*"([\d.]+)rem"'; top5 = sum(top 5)/total

# 3 weights
grep -oE 'fontWeight: [^,}]+' $F | sort | uniq -c | sort -rn

# 4 spacing (JS, comments stripped)
python3 re: r'(?<![a-zA-Z])padding:\s*([^,}\n]+)', r'(?<![a-zA-Z])gap:\s*([^,}\n]+)', r'margin(Top|Bottom|Left|Right):\s*(-?\d+)'
canonical padding: expand 1/2/3-value shorthand to 4-tuple before counting distinct
grid share: all sides in {0,4,8,12,16,20,24,32} / in {0,8,16,24,32}

# 5 radius
grep -oE 'borderRadius: [^,}]+' $F | sort | uniq -c | sort -rn
sed -n '2268,4529p' $F | grep -o "\[style\*='border-radius[^']*'\]" | sort | uniq -c

# 6 colors (JS = lines 1276-2267 + 4530-58006, /* */ and // comments removed)
hex:  r'(?<![\w&])#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b|(?<![\w&])#[0-9a-fA-F]{3}\b'
rgba: r'rgba?\([^)]*\)'   (run on JS and on CSSARR+STYLE separately, then union)
concat hex: r'\b([A-Z0-9_]+_H|LOCKED_BADGE) \+ "[0-9A-Fa-f]{2}"'
var():  grep -o 'var(--' | wc -l   on JS and CSSARR

# 7 shadows
grep -oE 'boxShadow: [^,}]+' $F | sort | uniq -c ; sed -n '2268,4529p' $F | grep -oE 'box-shadow:[^;}]+' | sort | uniq -c

# 8 motion
grep -oE 'transition: "[^"]*"' $F | sort | uniq -c | sort -rn
durations: r'(?<![\w.])(\d*\.?\d+m?s)\b' over all transition strings
easings:   r'(cubic-bezier\([^)]*\)|ease-in-out|ease-out|ease-in|ease|linear|steps\([^)]*\))'
grep -o '@keyframes [a-zA-Z0-9_-]*' $F | sort -u | wc -l  # 51
grep -oE 'animation: "[^"]*"' $F | sort | uniq -c

# 9 gradients
grep -o 'linear-gradient(' $F | wc -l ; grep -o 'radial-gradient(' $F | wc -l
classification: ±5-line context regex (mask|scrim|transparent 100%) → scrim; (progress|pct|percent|ratio|chart|ring|meter|track|stripe|Math\.(min|max|round)|\* 100) → functional; else decorative; then manual check of the 66 `#9A3412` accent-button fills

# 10 important / emoji
grep -o '!important' $F | wc -l ; sed -n '2268,4529p' $F | grep -o '!important' | wc -l
emoji literal: iterate JS lines, skip comment lines, extract "..."/'...'/`...` literals, match
  [\U0001F300-\U0001FAFF\U0001F1E6-\U0001F1FF☀-➿⭐⭕⏩-⏺⌚⌛⌨⏏◻-◾⤴⤵⬅-⬇⬛⬜〰〽㊗㊙]
emoji escaped: r'\\uD83[C-E]\\uD[C-F][0-9A-F]{2}' ; dingbats r'\\u(2[67][0-9A-F]{2}|2B5[05]|231[AB]|23E9|23F[0-9A])'

# 11 icons
grep -c 'createElement("svg"' $F ; grep -o 'createElement(Ic\b' $F | wc -l
sed -n '5234,5331p' $F     # Ic + D map (45 keys)
python3: brace-match each `createElement(Ic, {` prop object; count w:, z:, d:

# 12 components
grep -nE '^function [A-Z]\w*\(|^(var|const) [A-Z]\w* = (\(|function|React\.memo)' $F
per-component ce/style: slice from match line to next column-0 statement; count 'React.createElement(' and 'style: {'
grep -c 'React.createElement(' $F   # 4407 ; grep -c 'style: {' → 3719
grep -n 'role: "tablist"' $F ; grep -n 'borderRadius: 999' $F
grep -nE '\bDs(Card|Row|Section|Header|Segmented|Stat)\b' $F | grep -v ':function Ds'
```

Scripts as run: `measure.py`, `norm.py` in the session scratchpad (`/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/`).
