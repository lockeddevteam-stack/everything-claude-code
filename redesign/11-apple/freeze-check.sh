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

# The freeze protects functions from being LOST. A wave that adds a screen or
# a control is doing its job, and a check that fires on that is a check people
# learn to ignore. So: a column going down, or a screen disappearing, is a
# violation. Going up is reported and passes.
lost, gained = [], []
for k in sorted(set(was) | set(now)):
    a, b = was.get(k), now.get(k)
    if a == b:
        continue
    if b is None:
        lost.append('  %-26s SCREEN GONE (was %s)' % (k, ','.join(a)))
    elif a is None:
        gained.append('  %-26s new screen (%s)' % (k, ','.join(b)))
    else:
        down = [i for i in range(5) if int(b[i]) < int(a[i])]
        line = '  %-26s was %s  now %s' % (k, ','.join(a), ','.join(b))
        (lost if down else gained).append(line)

if lost:
    print('FREEZE VIOLATION — a function was lost:')
    print('\n'.join(lost))
    sys.exit(1)
if gained:
    print('freeze check: nothing lost. Added:')
    print('\n'.join(gained))
    print('\nRe-baseline when the wave is done:')
    print('  python3 11-apple/gen-manifest.py > 11-apple/FEATURE-MANIFEST.md')
    sys.exit(0)
print('freeze check: %d screens, no function changed' % len(now))
PY
