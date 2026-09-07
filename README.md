# Sports Fan Planner

Mobile-first planner for soccer fans. Production v1 answers three questions only:

1. **What live / upcoming games do I care about?**
2. **Where can I watch?** (opens a destination — never plays video here)
3. **What should I know about followed teams?**

## Product lock (non-negotiable)

**This app never streams games and never embeds live video.** There is no player, no rights acquisition, and no ESPN-like in-app playback. Where-to-watch is honest: **Live · Replay · Unknown**. Destinations (Apple TV / MLS Season Pass, ESPN+, Peacock, Paramount+, CBS, beIN, etc.) open in a new tab. Prefer services the user marks as already subscribed.

No monetization or pricing UI in v1.

## Screens

- **My Week** — favorites-complete ~7 day window (US Eastern) for followed clubs
- **Game Detail** — crests, kickoff, venue, where-to-watch destinations only
- **Follows** — Julio’s 11 seed clubs plus more soccer; real public crests
- **Watch destinations** — mark owned/subscribed services (not checkout)
- **News** — follow-only notes (outbound links)
- **Remind** — local device reminders (no push in v1)
- **Conflicts** — overlapping kickoffs among followed clubs

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
