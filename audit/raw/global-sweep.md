# Global code-quality sweep (Wave 0, orchestrator)

- TODO/FIXME/HACK/XXX markers: **0** (clean)
- console.* calls left in production: **7**
- Blocking alert/confirm/prompt dialogs: **4**
- **Empty catch blocks: 90** — errors swallowed silently app-wide
- innerHTML assignments: 7 (lines 646, 671, 798, 807, 906, 992 in the auth/paywall layer; 58004 and 58011 in the mount error handler)
  - line 58004 interpolates `e.message` into innerHTML — low-severity injection surface
- dangerouslySetInnerHTML: 0

## Storage layer
- All persistence goes through `ld(k, fb)` (2417-2425) and `sd(k, v)` (2435-2451)
- Every key is prefixed `lk_` and JSON-encoded (2420, 2437)
- Budget assumed 5 MB; `lkStorageUsage` (2456-2470) reports total and progress-photo bytes
- Quota failure fires a toast plus a `lockedStorageFull` CustomEvent (2443-2448)
- **82 distinct logical storage keys** (see keys-all.txt)

## Storage orphans
- `weightsKgMigrated` — written at 4460, never read. Migration flag nothing checks.
- `unitConversion` — read at 4293 (`ld("unitConversion", true)`), never written. Always the default.
- `rpe` was a false positive: the regex `ld(\"` also matches `setField(\"rpe\"`.

## Raw localStorage access that BYPASSES the ld/sd wrapper

The 82 ld/sd keys are not the whole data layer. These are touched directly:

| Key / prefix | Lines | Purpose |
|---|---|---|
| `lk_theme` | 20 | boot-time theme, read before React |
| `lk_textScale` | 38 | boot-time text scale |
| `lk_deployVersion` | 83, 96, 114, 33577 | deploy-version check / cache bust |
| `GUEST_FLAG` (`lk_guestMode`) | 166, 169, 287, 288 | guest mode flag |
| `lk_profile` | 171, 172 | seeded directly on guest start |
| `MC_SYNC_FLAG` (`lk_mcCloudSync`) | 224, 1188 | cycle-data cloud-sync opt-in |
| `__lk_ts__<key>` | 397, 1193, 19476, 19494 | per-key sync timestamps (shadow keys) |
| `DEVICE_KEY` | 1345, 1358 | device identifier |
| `test` | 2413, 2414 | storage-availability probe (not cleaned up on throw) |
| `lk_customEx` | 4278 | custom exercises, raw parse |
| `lk_weightStorageUnit` | 4389 | unit preference |
| `lk_throwbackForce` | 4604 | debug/force flag for the throwback card |
| `yt3_*` | 7068, 7083 | YouTube video-ID cache — no `lk_` prefix, escapes quota warnings and sync |
| `lk_mcProfile`, `lk_mcDays` | 26009, 26010 | deleted directly on 'delete all cycle data' |

Also note: `window.localStorage.setItem` is **monkey-patched** at 233-235 to
stamp `__lk_ts__` timestamps, so every write has a side effect.

### Implication for the redesign
Storage is not a single abstraction. Three layers coexist: the `ld`/`sd`
wrapper (82 keys), direct raw access (14+ keys/prefixes above), and a
patched `setItem` that shadows writes with timestamp keys.

## Wave 2 disambiguation: TWO unrelated "cycle" features

Agents flagged a possible duplicate cycle implementation. It is not a duplicate.
The word "cycle" names two entirely separate modules:

**1. Menstrual cycle tracking** — `Mc*` components, lines 22417-26140.
- Full-screen route: `screen === "cycletrack"` renders `CycleTrackerScreen` (57675)
- Home card: `CycleTrackerCard` (22596) rendered at 26612, gated on `isFemaleUser(p.profile)`
- Storage: `lk_mcProfile`, `lk_mcDays`, `lk_mcCloudSync`, `lk_mcFuelAdjust`

**2. Performance-enhancing compound cycle tracking ("Stack")** — `CycleTab`, line 47432.
- Fuel sub-tab: rendered at 37460 when `tab === "cycle"`, labelled **"Stack"** (37329)
- Gated behind the `perfTracking` setting, default **false** (33335, 37329)
- Tracks compounds with dose, route (Oral/injectable), frequency, category
  `compCat: "aas"` (anabolic-androgenic steroids), and cycle length in weeks (47456-47461)
- Storage: `lk_cycles`, `lk_cycleLog`
- Settings toggle at 33335-33360

These share no code and no storage. The redesign must keep them distinct; the
overloaded "cycle" name in both component and storage-key naming
(`cycles`/`cycleLog` vs `mcDays`/`mcProfile`) is a live source of confusion.

## Wave 0 count corrections (from agent reports)

- `Onboarding` ends at **34767**, not 35762. Lines 34768-35656 are a `FOODS`
  nutrition database plus `estimateMacros`/`calcTDEE`/`calcMacros`
  (reported by Agent 9, who documented them anyway).
- Event listeners: **54** actual, not the 106 raw grep matches.
- Timers: **65** actual, not the 81 raw grep matches.
  (Raw counts included definition sites and string matches.)
