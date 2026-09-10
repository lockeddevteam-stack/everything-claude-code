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
