# Lab

Harnesses, not screens. Nothing here ships and nothing here is held to the
design spec: these files exist so a component can be driven in isolation and
measured.

`bodymap-lab.html` drives `08-build/bodymap.js` and `08-build/vendor/body-art.js`
on their own — every muscle group, both views, both themes, at zoom. It is what
`tests/tap-test.mjs`, `tests/bodymap-audit.mjs` and the body-map screenshots
point at.

It lived in `08-build/` behind a `mockup-` prefix that the assembler excluded.
A review then scored it as the build's worst screen, correctly: it carries
6.72px labels, sub-AA contrast on those labels, and thin muscle strips no thumb
hits. All of that is true and none of it ships — the body map inside
`exercise-library.html` and `progress.html` renders no text at all. The prefix
was carrying that distinction and a prefix is not strong enough to carry it.
