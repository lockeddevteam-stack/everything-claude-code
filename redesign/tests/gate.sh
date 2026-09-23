#!/bin/sh
# THE GATE: does the app still do the thing people open it to do.
#
#   sh redesign/tests/gate.sh
#
# Run this before every push. It is the subset that has actually caught
# real breakage -- a workout that would not log, a session that vanished
# on reload, a first install that looped forever, a second workout that
# saved nothing -- and it is deliberately small enough that there is no
# excuse not to run it. run-parallel.sh is the whole thing, for before a
# release.
#
# What is NOT here: the design and accessibility suites. They matter and
# they have caught real regressions (a clipped figure at AX5, a blocked
# pinch zoom), but they do not change under a logic fix, and a gate that
# takes fifteen minutes is a gate nobody runs.
cd "$(dirname "$0")" || exit 1

JOBS="${JOBS:-$(nproc 2>/dev/null || echo 3)}"
OUT=/tmp/lk-gate
rm -rf "$OUT" && mkdir -p "$OUT"
export OUT

printf 'building\n'
if ! node ../10-final/assemble.mjs --prod --i-know-this-is-not-production > "$OUT/build.log" 2>&1; then
  printf 'FAIL  the product build did not assemble\n'
  tail -20 "$OUT/build.log"
  exit 1
fi
if ! node ../10-final/assemble.mjs >> "$OUT/build.log" 2>&1; then
  printf 'FAIL  the demo build did not assemble\n'
  tail -20 "$OUT/build.log"
  exit 1
fi

START=$(date +%s)
printf 'gate: %s checks, %s at a time\n\n' 26 "$JOBS"

cat > "$OUT/jobs.txt" <<'JOBS_EOF'
day-in-the-app|node day-to-day.mjs
first-run|node first-run.mjs
product-build|node prod-build.mjs
empty-state|node empty-state.mjs
session-persist|node session-persist.mjs
crossings|node nav-selectors.mjs
no-dead-ends|node no-dead-ends.mjs
past-session|node past-session.mjs
bad-data|node bad-data.mjs
gestures|node gestures.mjs
rest-clock|node rest-clock.mjs
singulars|node singulars.mjs
setup-recovery|node setup-recovery.mjs
one-of-everything|node one-of-everything.mjs
pounds|node pounds.mjs
late-night|node late-night.mjs
destructive|node destructive.mjs
hostile-text|node hostile-text.mjs
escaping|node escaping.mjs
hostile-server|node hostile-server.mjs
coach-apply|node coach-apply.mjs
offline|node offline.mjs
body-picker|node body-picker.mjs
worker-cors|node worker-cors.mjs
tutor-copy|node tutor-copy.mjs
app-feel|node app-feel.mjs
reorder-everywhere|node reorder-everywhere.mjs
reorder-physics|node reorder-physics.mjs
left-and-right|node left-and-right.mjs
keypad-stable|node keypad-stable.mjs
body-hidden-view|node body-hidden-view.mjs
onboarding-handoff|node onboarding-handoff.mjs
quick-workout|node quick-workout.mjs
pounds-history|node pounds-history.mjs
gestures2|node gestures2.mjs
spoken-portions|node spoken-portions.mjs
say-it-log|node say-it-log.mjs
barcode-decode|node barcode-decode.mjs
scan-camera|node scan-camera.mjs
no-dev-controls|node no-dev-controls.mjs
body-reach|node body-reach.mjs
muscle-split|node muscle-split.mjs
catalogue-curation|node catalogue-curation.mjs
one-search|node one-search.mjs
portion-dial|node portion-dial.mjs
generic-names|node generic-names.mjs
server-reason|node server-reason.mjs
meal-basis-persist|node meal-basis-persist.mjs
meal-edit|node meal-edit.mjs
keyboard-lift|node keyboard-lift.mjs
no-zoom|node no-zoom.mjs
voice|node voice.mjs
keyboard|node keyboard.mjs
cloud-contract|node cloud-contract.mjs
session-refresh|node session-refresh.mjs
account-identity|node account-identity.mjs
coach-brief|node coach-brief.mjs
coach-flight|node coach-flight.mjs
coach-vocab|node coach-vocab.mjs
weigh-in-tenths|node weigh-in-tenths.mjs
body-zoom|node body-zoom.mjs
muscle-week|node muscle-week.mjs
progression|node progression.mjs
split-writeback|node split-writeback.mjs
split-prescription|node split-prescription.mjs
pick-body|node pick-body.mjs
addex-body|node addex-body.mjs
input-feel|node input-feel.mjs
fuel-plan|node fuel-plan.mjs
JOBS_EOF

# shellcheck disable=SC2016
< "$OUT/jobs.txt" xargs -P "$JOBS" -I{} sh -c '
  line="{}"
  name=${line%%|*}
  cmd=${line#*|}
  if sh -c "$cmd" > "$OUT/$name.log" 2>&1; then
    printf "PASS  %s\n" "$name"
  else
    printf "FAIL  %s\n" "$name"
    printf "%s\n" "$name" >> "$OUT/failed.txt"
  fi
'

END=$(date +%s)
printf '\n-----------------------------------------\n'
printf 'gate ran in %ss\n' "$((END - START))"
if [ -s "$OUT/failed.txt" ]; then
  printf 'GATE FAILED:\n'
  while read -r n; do
    printf '  %s\n' "$n"
    grep -m5 -E '^FAIL' "$OUT/$n.log" | sed 's/^/      /'
  done < "$OUT/failed.txt"
  exit 1
fi
printf 'GATE PASSED — safe to push\n'
