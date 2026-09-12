### F-GAME-001 — Streak counter (Home)
- location: Home tab > dashboard streak card, and the profile header chip
- user action: none — passive display; finishing a workout updates it
- behaviour: counts consecutive training days backwards from today (or yesterday if today is untrained), capped at 30 iterations (26237-26252). A second, uncapped implementation walks the same way over a date set built from history (1458-1466). Rendered only when `streak > 0 && ld("gamingLayer", false)` (26423, 26510).
- v6 status: **WORKING but hidden by default**

### F-GAME-002 — Badges (Progress screen)
- location: Home tab > Progress screen > "Badges" grid
- user action: none — passive; earned by logging workouts and PRs
- behaviour: seven earn conditions evaluated inline on render from `history.length`, `prCount` and `totalSets` (30166-30208); up to three "locked" placeholders with "N more to go" copy (30209-30227); grid of earned then locked tiles (30424-30500).
- v6 status: **WORKING but hidden by default**

### F-GAME-003 — Streaks-and-badges master toggle
- location: Profile tab > Settings > "Streaks and badges" switch, subtitle "Show the streak counter and achievement badges"
- user action: Taps the switch
- behaviour: `setGamingEnabled(next)` and `sd("gamingLayer", next)` (33046-33050); all three consumers read `ld("gamingLayer", false)` at render time (26423, 26510, 30396).
- v6 status: **WORKING**
