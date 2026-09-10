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
