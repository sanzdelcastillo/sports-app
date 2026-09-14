# Sports Fan Planner

Mobile-first planner for soccer fans. Production v1 answers three questions only:

1. **What live / upcoming games do I care about?**
2. **Where can I watch?** (opens a destination — never plays video here)
3. **What should I know about followed teams?**

## Product lock (non-negotiable)

**This app never streams games and never embeds live video.** There is no player, no rights acquisition, and no ESPN-like in-app playback. Where-to-watch destination badges: **Upcoming · Live · Replay · Unknown** (Live only while the match is in progress; the match ● LIVE pill is separate). Destinations (Apple TV / MLS Season Pass, ESPN+, Peacock, Paramount+, beIN) open in a new tab. Prefer services the user marks as already subscribed. TheSportsDB + bundled seed for v1; ESPN scoreboard proxy later.

No monetization or pricing UI in v1.

## Screens

- **My Week** — favorites-complete ~7 day window (US Eastern) for followed clubs, with a coverage line ("6 of 9 upcoming in your apps or free · 3 need Paramount+") and a hide-scores toggle
- **Game Detail** — crests, kickoff, venue, where-to-watch destinations only
- **Follows** — Julio’s 11 seed clubs plus more soccer; real public crests
- **My apps** (`/watch`) — tick the services you pay for; free services are listed but never need ticking
- **Share my week** (`/share`) — plain-text week (day, kickoff ET, matchup, where to watch) with Copy and native Share; never includes scores
- **News** — follow-only notes (outbound links)
- **Remind** — local device reminders (no push in v1)
- **Conflicts** — overlapping kickoffs among followed clubs, with a suggested "watch live" / "catch up later" split

## Access labels

Every game carries one chip derived from the user's own service list (`src/data/watch.ts` → `accessFor`):

| Chip | Meaning |
| --- | --- |
| **In your apps · Peacock** | Primary destination is a service the user ticked. Self-reported — never a verified entitlement. |
| **Free on Fandango** | Primary destination needs no subscription. |
| **Needs Paramount+** | We know the destination and the user has not ticked it. CTA becomes "Check Paramount+". |
| **Where to watch unknown** | No confident U.S. destination for that competition. |

Copy never says "you can watch" — only what the user told us and what the map says.

## Rights map freshness

`RIGHTS_REVIEWED_ON` and `RIGHTS_SEASON` in `src/data/watch.ts` are shown on My apps, Game Detail, and in the share text. Update the date whenever the map is checked against current U.S. rights. As of the 2026-27 review: MLS is included with Apple TV (Season Pass discontinued), Bundesliga streams free on Fandango with select games on USA Network, Premier League is Peacock (+ NBC/USA), La Liga is ESPN+, UEFA/Serie A/Liga Portugal are Paramount+ (+ CBS), Ligue 1 is beIN.

## Checks

```bash
npm run build         # type-check + bundle
npm run lint          # oxlint
npm run check:access  # access labels, coverage roll-up, share text, rights-map hygiene
```

## Seed clubs (Julio’s 11)

Inter Miami, LA Galaxy, Real Madrid, Atlético Madrid, Barcelona, Manchester City, Manchester United, Liverpool, Arsenal, Paris Saint-Germain, Inter Milan.

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev
```

Open the printed localhost URL (default `http://localhost:5173`).

```bash
npm run build    # production bundle
npm run preview  # serve the build
```

No API key is required for first boot. Fixture seed data is bundled so My Week is never empty when followed-team games exist in the seed.

## Data

| Layer | Source | Key? |
| --- | --- | --- |
| First boot / offline | Bundled seed fixtures (TheSportsDB snapshot, Sep 2026 week) | None |
| Live refresh | [TheSportsDB](https://www.thesportsdb.com/) public v1 (`json/3`) — CORS-open, no key | None |
| Crests | TheSportsDB badges, ESPN CDN fallback `a.espncdn.com/i/teamlogos/soccer/500/{id}.png` | None |

Live fetch is per followed team (`eventsnext` + `eventslast`) and merged with seed so a missed club still appears when seed coverage exists (**favorites-complete**).

Optional later: a free [football-data.org](https://www.football-data.org/) key can be added behind a small proxy. Not required for v1.

Where-to-watch mappings are **US-market guidance** and can go stale when rights move. The UI says so.

## Stack

React 19 + TypeScript + Vite. Clean layers:

- `src/data` — teams, leagues, seed fixtures, where-to-watch map
- `src/services` — TheSportsDB client + week merge
- `src/stores` — follows, subscriptions, reminders (localStorage)
- `src/screens` — My Week, Game Detail, Follows, News, Remind, Conflicts, Watch

Soccer first; team records include `leagueId` so NFL / MLB / NBA / NHL can be added later without rewriting the week view.

## Deploy

Static SPA. `vercel.json` and `public/_redirects` rewrite all routes to `index.html`.
