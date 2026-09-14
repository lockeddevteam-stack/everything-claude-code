# LOCKED v7

The build that replaces v6.0 at `locked-seven.vercel.app`.

## What it is

`app/index.html`, written by `node 10-final/assemble.mjs --prod`. Eighteen
screens in one document, each in its own shadow root, no build step, no
framework, no network at load.

It is the same code as the demo with two differences, and both matter:

| | demo (`demo/`) | product (`app/`) |
|---|---|---|
| `fixtures.js` | inlined | **left out** |
| dev state switcher | shown | hidden |

That is the whole of it. Same screens, same scripts, same order.

## Why the seed had to go

`LKStore.get` falls back to `LKFixtures` for any key nobody has written.
In a demo that is the point. In the product it meant a real person signing
up with an empty account was shown, as their own:

> 22 Sessions · 12 Records · 288 Sets · 140k kg Volume

with Home reading "16 sets · 14,363 kg" — while the store, asked at the
same moment, said their history had never been written. Every figure was
a stranger's.

The product build reads 0 Sessions, 0 Records, 0 Sets, 0k kg, and Home
says "No sessions yet — Build a split and LOCKED puts one session on this
screen each training day" against today's date. That empty state was
written long ago and was never reachable.

## What v6 readers get

Their data, converted on first open. Eight migrations, every one idempotent
and proven against the shapes the live project actually holds:

1. records map → the flat array every screen reads
2. the kg marker
3. sessions: `vol: "3608 kg"` → `kg: 3608`, `dur: "39 min"` → `min: 39`,
   sets stored as strings → numbers, US dates → ISO, `dateISO` preferred
4. split days: `exIds` → exercises
5. names and ISO dates resolved from the 866-row catalogue
6. `lk_gamingLayer` → `lk_badges`, so the streaks switch survives its rename
7. `lk_profile.goal` "Cut"/"Maintain"/"Bulk" → `cut`/`maintain`/`build`,
   without which a cutting reader was handed maintenance calories
8. a fuel day's bucketed `meals` → the list Fuel reads, `water` → `waterMl`

Where a migration adds a field it keeps the old one beside it — `vol`,
`dur`, `w`, `r`, `exIds`, `water` — so a device still running v6 can read
what this build has written. Two cannot be kept both ways: `lk_prs` becomes
an array and a fuel day's `meals` becomes a list. See
`../15-server/README.md`. **This is a cutover, not a parallel run.**

## What was verified

- 1577 checks in `tests/run-all.sh`
- 36 routes on the product build, on a new account and an upgraded one
  (`tests/prod-build.mjs`)
- all five live account shapes rendered, pressed, typed into and written
  over (`v6-render`, `v6-demo`, `v6-press`, `v6-journey`, `v6-resume`)
- a whole session logged on converted history: 60 kg × 8 lands as a 480 kg
  session beside the converted ones, nothing disturbed
- the migrations run three times over with byte-identical results
- 65 walkthrough lines, six tracks, resume and cross-device state

## What was NOT verified, and cannot be from here

The live backend. This environment's egress proxy blocks `supabase.co` and
`workers.dev`, so every backend check runs against a local mirror built to
the real contract. The first contact between this build and the real
Supabase project and Worker happens in production. That is the single
largest untested edge, and it is named here rather than discovered.

`USDA_KEY` is reported bound on the Worker; the binding is not readable
through Cloudflare's API by design. The deployed bundle still carries
`env.USDA_KEY || "DEMO_KEY"` at line 1542, which is inert while the secret
is set.

## How the swap happens

The `locked` Vercel project (`prj_J9fXzQVDERllvwefJ7FJl82QgjRv`, domain
`locked-seven.vercel.app`) has no git link and deploys by upload, so it
cannot be replaced from a session without the Vercel CLI. One setting
fixes that permanently, and matches how `locked-demo` already works:

1. Vercel → project `locked` → Settings → Git → connect
   `lockeddevteam-stack/everything-claude-code`
2. Root Directory: `app`
3. Production Branch: `main`

After that every push to `main` ships v7 to `locked-seven.vercel.app`, and
`app/` is already committed and current.

Until then v6.0 stays live, which is the safe state rather than a broken
one.
