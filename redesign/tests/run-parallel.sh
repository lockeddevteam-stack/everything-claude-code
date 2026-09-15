#!/bin/sh
# THE SUITE, IN PARALLEL, WITH A FAST GATE IN FRONT OF IT.
#
#   sh redesign/tests/gate.sh        the checks that catch real breakage, ~1 min
#   sh redesign/tests/run-parallel.sh   everything, ~4x faster than run-all.sh
#
# WHY THIS EXISTS. run-all.sh runs about twenty-five suites one after
# another, and the per-screen audit inside it launches eighteen separate
# Chromiums in a row. Measured on this box: four screens sequentially take
# 2m14s and the same four in parallel take 50s. The whole suite was taking
# over half an hour, which is long enough that it stops being run before a
# change and starts being run after one -- and a check you only read after
# shipping is a changelog, not a gate.
#
# Every suite here binds port 0, so they cannot collide; the only thing
# they share is CPU, and the job count is set from nproc rather than
# guessed. Output goes to one file per suite so the lines of two suites
# running at once cannot interleave into nonsense.
cd "$(dirname "$0")" || exit 1

JOBS="${JOBS:-$(nproc 2>/dev/null || echo 3)}"
OUT="${OUT:-/tmp/lk-suite}"
rm -rf "$OUT" && mkdir -p "$OUT"

ls ../08-build/*.html | xargs -n1 basename | grep -v '^mockup-' > "$OUT/screens.txt"

# One job = one line: "<name>|<command>". Named so a failure says what broke
# rather than which line number of a shell script it was on.
JOBFILE="$OUT/jobs.txt"
: > "$JOBFILE"
add() { printf '%s|%s\n' "$1" "$2" >> "$JOBFILE"; }

# --- the functional gate: does the app still do its job -----------------
add "day-in-the-app"        "node day-to-day.mjs"
add "first-run"             "node first-run.mjs"
add "product-build"         "node prod-build.mjs"
add "empty-state"           "node empty-state.mjs"
add "session-persist"       "node session-persist.mjs"
add "crossings"             "node nav-selectors.mjs"
add "no-dead-ends"          "node no-dead-ends.mjs"
add "past-session"          "node past-session.mjs"
add "bad-data"              "node bad-data.mjs"
add "gestures"              "node gestures.mjs"
add "rest-clock"            "node rest-clock.mjs"
add "singulars"             "node singulars.mjs"
add "setup-recovery"        "node setup-recovery.mjs"
add "one-of-everything"     "node one-of-everything.mjs"
add "pounds"                "node pounds.mjs"
add "late-night"            "node late-night.mjs"
add "destructive"           "node destructive.mjs"
add "hostile-text"          "node hostile-text.mjs"
add "escaping"              "node escaping.mjs"
add "hostile-server"        "node hostile-server.mjs"
add "coach-apply"           "node coach-apply.mjs"
add "offline"               "node offline.mjs"
add "body-picker"           "node body-picker.mjs"
add "worker-cors"           "node worker-cors.mjs"
add "keyboard"              "node keyboard.mjs"
add "accounts"              "node v6-accounts.mjs"
add "cloud-contract"        "node cloud-contract.mjs"
add "coach-server"          "node coach-server.mjs"
add "coach-actions"         "node coach-actions.mjs"
add "catalogue-ids"         "node catalogue-ids.mjs"

# --- the data suites: an upgrading reader's real shapes ------------------
add "v6-render"             "node v6-render.mjs"
add "v6-demo"               "node v6-demo.mjs"
add "v6-press"              "node v6-press.mjs"
add "v6-journey"            "node v6-journey.mjs"
add "v6-resume"             "node v6-resume.mjs"

# --- the design and accessibility suites --------------------------------
add "foundation"            "node apple-foundation.mjs"
add "chrome"                "node chrome-check.mjs"
add "squircles"             "node squircle-check.mjs"
add "press-audit"           "node press-audit.mjs"
add "press-pointer"         "node press-pointer.mjs"
add "re-render"             "node rerender-sweep.mjs"
add "body-map"              "node tap-test.mjs"
add "accent"                "node accent-audit.mjs"
add "focus"                 "node focus-audit.mjs"
add "skeletons"             "node skeleton-fit.mjs"
add "dynamic-type"          "node dynamic-type.mjs"
add "actions"               "node action-coverage.mjs"
add "walkthrough"           "node tutor-copy.mjs"

# --- one job per screen, which is where the time was --------------------
while read -r f; do
  add "screen:$f" "node screen-audit.mjs $f"
done < "$OUT/screens.txt"

run_one() {
  name=${1%%|*}
  cmd=${1#*|}
  safe=$(printf '%s' "$name" | tr -c 'A-Za-z0-9._-' '_')
  if sh -c "$cmd" > "$OUT/$safe.log" 2>&1; then
    printf 'PASS  %s\n' "$name"
  else
    printf 'FAIL  %s   (%s/%s.log)\n' "$name" "$OUT" "$safe"
    printf '%s\n' "$name" >> "$OUT/failed.txt"
  fi
}

# Exported so xargs' subshells can reach it.
export OUT
run_one_export() { run_one "$@"; }

printf 'running %s suites, %s at a time\n\n' "$(wc -l < "$JOBFILE")" "$JOBS"
START=$(date +%s)

# shellcheck disable=SC2016
< "$JOBFILE" xargs -P "$JOBS" -I{} sh -c '
  line="{}"
  name=${line%%|*}
  cmd=${line#*|}
  safe=$(printf "%s" "$name" | tr -c "A-Za-z0-9._-" "_")
  if sh -c "$cmd" > "$OUT/$safe.log" 2>&1; then
    printf "PASS  %s\n" "$name"
  else
    printf "FAIL  %s   (%s/%s.log)\n" "$name" "$OUT" "$safe"
    printf "%s\n" "$name" >> "$OUT/failed.txt"
  fi
'

END=$(date +%s)
printf '\n-----------------------------------------\n'
printf 'ran in %ss\n' "$((END - START))"
if [ -s "$OUT/failed.txt" ]; then
  printf 'SOME SUITES FAILED:\n'
  sed 's/^/  - /' "$OUT/failed.txt"
  printf '\nfirst failing lines:\n'
  while read -r n; do
    safe=$(printf '%s' "$n" | tr -c 'A-Za-z0-9._-' '_')
    grep -m3 -E '^FAIL' "$OUT/$safe.log" | sed "s|^|  $n: |"
  done < "$OUT/failed.txt"
  exit 1
fi
printf 'ALL SUITES PASSED\n'
