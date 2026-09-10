#!/bin/sh
# The freeze check. Compares the function columns only: listeners, actions,
# buttons, inputs and testids. Line counts move on every restyle and a check
# that fires on every edit is one people learn to ignore.
#
#   sh 11-apple/freeze-check.sh
#
# Silence is a clean wave.
cd "$(dirname "$0")/.." || exit 1
python3 11-apple/gen-manifest.py > /tmp/lk-manifest-now.md || exit 1
python3 - "$@" <<'PY'
import re, sys
def cols(path):
    out = {}
    for m in re.finditer(r'^\| `([^`]+)` \| \d+ \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$',
                         open(path).read(), re.M):
        out[m.group(1)] = m.group(2, 3, 4, 5, 6)
    return out
was = cols('11-apple/FEATURE-MANIFEST.md')
now = cols('/tmp/lk-manifest-now.md')
bad = []
for k in sorted(set(was) | set(now)):
    if was.get(k) != now.get(k):
        bad.append('  %-26s was %s  now %s' % (k, was.get(k), now.get(k)))
if bad:
    print('FREEZE VIOLATION — a function changed:')
    print('\n'.join(bad))
    sys.exit(1)
print('freeze check: %d screens, no function changed' % len(now))
PY
