### F-SHARED-001 — Style profile (theme) switching
- location: ** boot script `:15-31`; theme engine `:2469-2540`; CSS theme rules inside the `CSS` array `:2326`; pre-React shell tokens `:1218-1233`.
- user action: ** picks one of five style profiles in Settings (Settings screen is outside my range); `setTheme(id)` is the entry point (`:2534`).
- behaviour: ** 1. Before first paint, the inline boot script reads `localStorage["lk_theme"]`, and with nothing stored follows `prefers-color-scheme: light` rather than forcing dark (`:20-21`). 2. It stamps `data-style-profile="<id>"` on `<html>`, adds `light-mode` for light or `theme-<id>` for slate/navy/midnight; plain `dark` gets no class (`:23-25`). 3. It rewrites `<meta name="theme-color">` from a hardcoded shell map `{light:#F2F2F7, dark:#080809, slate:#0D1117, navy:#070F1E, midnight:#0C0917}` (`:27-31`), so installed-PWA chrome matches. 4. At React boot `initTheme()` re-reads `lk_theme`, falls back to the same system query, and calls `applyTheme` (`:2500-2510`). 5. `applyTheme` sets `isDarkMode`, re-stamps the attribute, strips all of `ALL_THEME_CLASSES`, adds the right one, updates `theme-color`, and persists via `sd("theme", …)` (`:2511-2529`). 6. `toggleTheme` / `setTheme` additionally dispatch a `window` `"theme-changed"` event so components re-render (`:2530-2538`).
- v6 status: ** Shipped.

### F-SHARED-002 — Text size (Dynamic Type)
- location: ** boot script `:36-40`.
- user action: ** a Text Size setting (UI outside range) writes `lk_textScale` as an integer percentage.
- behaviour: ** on boot, `parseInt(localStorage.lk_textScale || "100")`; if non-100 it sets `document.documentElement.style.fontSize = scale + "%"`. Because every type token is `rem` (`:2101-2110`), the whole app scales. Applied pre-paint so nothing renders at the wrong size first.
- v6 status: ** Shipped. **Evidence:** unconditional boot code.

### F-SHARED-003 — Storage-full recovery
- location: ** `:2411-2467`.
- user action: ** implicit — any save that exceeds the localStorage quota.
- behaviour: ** 1. `storageAvailable` is probed once at boot with a write/remove of key `test` (`:2411-2416`); private-browsing failure makes every later read return the fallback and every write a silent no-op. 2. `sd()` catches, and if `lkIsQuotaError` matches (`QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, code 22, code 1014) shows a one-shot toast: "Storage is full - changes are not being saved. Free space by deleting progress photos." (`:2443-2448`). 3. It also dispatches a `lockedStorageFull` CustomEvent carrying the key (`:2450`). 4. `sd()` returns a boolean so callers can roll back — `saveProgressPhoto` does exactly that (`:2868-2871`). 5. `lkStorageUsage()` walks every localStorage key, sums `(key.length + value.length) * 2` bytes, isolates `lk_progressPhotos`, and reports against a hardcoded `budgetBytes: 5 * 1024 * 1024` (`:2456-2467`).
- v6 status: ** Shipped. **Evidence:** guard + toast + event + boolean return all present and used by a caller at `:2868`.

### F-SHARED-004 — Error recovery screens
- location: ** `ErrorBoundary` `:2540-2600`; `ScreenBoundary` `:2601-2657`.
- user action: 
- behaviour: ** see "Error boundaries" section below.
- v6 status: ** Shipped. **Evidence:** both are React class components with `getDerivedStateFromError` and a rendered fallback.

### F-SHARED-005 — Progress photo capture & compression
- location: ** `resizeImage` `:2878-2905`, `saveProgressPhoto` `:2856-2877`.
- user action: 
- behaviour: ** file → `FileReader.readAsDataURL` → `<img>` → canvas downscale constrained on **both** axes (`maxH = round(maxW * 1.6)`) → `toDataURL("image/jpeg", 0.6)`. `saveProgressPhoto` appends `{date: ISO, note, thumb: base64}` to `lk_progressPhotos`, checks the `sd()` return, and on failure restores the previous array and returns `null`.
- v6 status: ** Shipped. **Evidence:** `:2866-2871` rollback logic.

### F-SHARED-006 — Weight log & refeed trigger
- location: ** `getWeightLog` `:2907`, `addWeightEntry` `:2910-2932`, `checkRefeedTrigger` `:2933-2963`, `calcRefeedCarbs` `:2964-2972`.
- user action: 
- behaviour: ** one entry per local calendar day (`isoDay()`), upserted and re-sorted ascending. Refeed fires only when `fuelProfile.goal === "cut"`, ≥3 entries exist, and each of the last three entries is a new all-time low; suppressed for 5 days after `lk_refeedDismissed` and for the day recorded in `lk_refeedAccepted`. `calcRefeedCarbs` returns 50/75/100 g by TDEE thresholds (2500/3000) plus 15 g if bodyweight > 90 kg.
- v6 status: ** Shipped.

### F-SHARED-007 — Keyboard-aware chrome & zoom lock
- location: ** `:41-68` (boot), `:1240` (`html.lk-kb-open nav{display:none}` is in the CSS array at `:2268`).
- user action: 
- behaviour: ** a `visualViewport` resize/scroll listener toggles `html.lk-kb-open` when the visual viewport drops below 80% of `innerHeight`, hiding the nav while the keyboard is up; `focusout` re-syncs after 60 ms to work around an iOS 26 `offsetTop` bug. Separately `gesturestart/change/end` are `preventDefault`ed to block pinch-zoom, with double-tap handled by `touch-action:manipulation` in CSS rather than swallowing `touchend`.
- v6 status: ** Shipped.

### F-SHARED-008 — Deploy-version cache bust
- location: ** `:76-116`.
- user action: 
- behaviour: ** every load fetches `https://lockedapi.cescocugliari.workers.dev/app-version` with `cache:"no-store"`; if the returned version differs from `lk_deployVersion`, it stores the new version, deletes every Cache Storage entry **except** `locked-v1`, then hard-reloads. Deliberately does not unregister the service worker (that would kill the push subscription). Fails silently on any error.
- v6 status: ** Shipped.

### F-SHARED-009 — Progress throwback
- location: ** `throwbackForced` `:4594`, `computeThrowback` `:4597-4662`, `dismissThrowback` `:4663`.
- user action: 
- behaviour: ** walks anchors 365/180/90/30 days, oldest-with-data wins; surfaces positive-only progression across bodyweight (direction judged by cut/bulk goal, threshold ±0.5 kg), up to two lifts by est-1RM delta (>0.5), and a photo pair within ±30 d of the anchor that is ≥21 d newer. Dismissal cooldown 3 days via `lk_throwbackDismissed`; `localStorage.lk_throwbackForce === "1"` bypasses the cooldown.
- v6 status: ** Shipped (dev override present). ---
