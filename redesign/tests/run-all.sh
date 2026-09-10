#!/bin/sh
# The whole suite, in the order that fails fastest.
#
#   sh redesign/tests/run-all.sh
#
# Every check here measures something in a real browser. A green run means
# the build renders, behaves and reads the way the spec says on thirteen
# screens, every state each one declares, in both themes.
cd "$(dirname "$0")" || exit 1
fail=0
run() {
  printf '\n=== %s ===\n' "$1"
  shift
  if "$@"; then :; else fail=1; fi
}

ls ../08-build/*.html | xargs -n1 basename | grep -v '^mockup-' > /tmp/screens.txt

run "freeze — nothing lost"        sh ../11-apple/freeze-check.sh
run "foundation — springs, glass, squircles, type" node apple-foundation.mjs
run "chrome — collapse, minimize, edge, detents"   node chrome-check.mjs
run "squircles — smoothed vs capsules"             node squircle-check.mjs
run "press — every control moves"                  node press-audit.mjs
run "re-render — focus, caret, scroll"             node rerender-sweep.mjs
# One process per screen. Thirteen screens times a hundred states times two
# themes in one browser session outran Chromium's patience and the whole
# suite died on the last screen with everything before it green.
printf '\n=== %s ===\n' "screens — states x themes x axe x targets"
while read -r f; do
  node screen-audit.mjs "$f" | grep -E '^FAIL|failing|passed' | sed "s|^|$f  |" || fail=1
done < /tmp/screens.txt
run "body map — targets and selection"             node tap-test.mjs
run "accent — one fill per screen"                  node accent-audit.mjs
run "focus — never falls to the body"              node focus-audit.mjs
run "skeletons — nothing shifts on load"            node skeleton-fit.mjs
run "dynamic type — default ladder and AX5"         node dynamic-type.mjs
run "actions — every control does something"       node action-coverage.mjs
run "demo — assembled"                             sh -c 'node ../10-final/assemble.mjs && node ../10-final/verify-demo.mjs'

printf '\n%s\n' "-----------------------------------------"
if [ "$fail" = 0 ]; then echo "ALL SUITES PASSED"; else echo "SOME SUITES FAILED"; fi
exit $fail
