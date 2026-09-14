# Watch Plan

Mobile-first planner for soccer fans in the U.S. It answers three questions only:

1. **What live / upcoming games do I care about?**
2. **Where can I watch?** (opens a destination — never plays video here)
3. **What should I know about followed teams?**

## Product lock (non-negotiable)

**This app never streams games and never embeds live video.** There is no player, no rights acquisition, and no ESPN-like in-app playback. Where-to-watch destination badges: **Upcoming · Live · Replay · Unknown** (Live only while the match is in progress; the match ● LIVE pill is separate). Destinations (Apple TV / MLS Season Pass, ESPN+, Peacock, Paramount+, beIN) open in a new tab. Prefer services the user marks as already subscribed. TheSportsDB + bundled seed for v1; ESPN scoreboard proxy later.

No monetization or pricing UI in v1.

## Screens

- **My Week** — favorites-complete ~7 day window (US Eastern) for followed clubs: week stats, a "Your clubs" strip (each club's next game and whether you can reach it), schedule-change strip, catch-up-later queue, hide-scores toggle
- **Game Detail** — scoreboard with highlight link when finished, then tabs: Watch (destinations + listed U.S. broadcasts), Lineups, Table (standings + form), Calendar (file export)
- **Clubs** — follow any club in the supported leagues; full league lists come from the feed and are cached on device for a week
- **Welcome** — first-run flow: pick clubs, tick apps, build the week
- **Settings** — hide scores, crests on/off (text badges for image-rights-safe builds), move-my-setup code, About, erase data
- **My apps** (`/watch`) — tick the services you pay for; free services are listed but never need ticking
- **Share my week** (`/share`) — plain-text week (day, kickoff ET, matchup, where to watch) with Copy and native Share; never includes scores
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

## Premium data key (TheSportsDB, $9/mo)

The key is read on the server, never shipped to the browser. All data calls go to `/api/sportsdb/...`:

- **Deployed (Vercel):** `api/sportsdb/[...path].js` is a serverless function. It injects `SPORTSDB_KEY` for v1 calls and sends it as `X-API-KEY` for v2, allows only the endpoints the app uses, and sets edge cache headers so many phones share one upstream request.
- **Local:** `vite.config.ts` proxies the same paths, reading `SPORTSDB_KEY` from `.env.local` (git-ignored). Copy `.env.example` to `.env.local` and paste the key.
- **Without a key:** v1 falls back to the free key (one upcoming game per club, 30 req/min); v2 answers 503 and the app quietly turns live scores off.

Set it on Vercel: Project → Settings → Environment Variables → add `SPORTSDB_KEY` for all environments → Save → Deployments → Redeploy the latest.

What the key changes: 10 next / 10 previous games per club instead of 1, 100 requests a minute, real live scores every two minutes while a followed game is in play (`src/services/livescores.ts`), unwatermarked images, and it satisfies TheSportsDB's commercial-use requirement.

## Data freshness and limits

- **Last saved week.** Every successful live fetch is saved on the device (`sfp.lastGoodWeek.v1`). If the source is down, the app shows the saved week (labelled "Saved 3 hr ago") instead of the bundled sample. The sample seed is the last resort only.
- **Fetch only what's stale.** Each club records when it was last fetched (`sfp.fetchMeta.v1`). On open, only clubs older than 10 minutes are requested; toggling one club costs two requests, not twenty. The Refresh link forces every club.
- **Rate limit.** TheSportsDB's free key allows roughly 30 requests a minute. Requests are spaced 250 ms apart and a 429 is retried once after 2.5 s; the game page shows "The data source is busy" with Try again if it persists.
- **Game extras.** Lineups (`lookuplineup`) and standings with form (`lookuptable`) are cached per game / per league-season for 10 min / 1 hr. The free feed is community-maintained, so some lineups are partial — the UI says so rather than padding them.
- **Home-screen install.** `public/manifest.webmanifest`, icons, and `public/sw.js` (app shell network-first, hashed assets cache-first, API always network). Registered in production only.

## Data

| Layer | Source | Key? |
| --- | --- | --- |
| First boot / offline | Bundled seed fixtures (TheSportsDB snapshot, Sep 2026 week) | None |
| Live refresh | [TheSportsDB](https://www.thesportsdb.com/) public v1 (`json/3`) — CORS-open, no key | None |
| Crests | TheSportsDB badges, ESPN CDN fallback `a.espncdn.com/i/teamlogos/soccer/500/{id}.png` | None |

Live fetch is per followed team (`eventsnext` + `eventslast`) and merged with seed so a missed club still appears when seed coverage exists (**favorites-complete**).

Optional later: a free [football-data.org](https://www.football-data.org/) key can be added behind a small proxy. Not required for v1.

Where-to-watch mappings are **US-market guidance** and can go stale when rights move. The UI says so.

## Design system — Matchday Editorial

Shared with the Watch Plan prototype so both codebases read as one product. Tokens live at the top of `src/styles/global.css`.

| Role | Value |
| --- | --- |
| Paper / paper highlight | `#F3EFE4` / `#FBF8F0` — planning surfaces |
| Deep pitch / pitch / pitch soft | `#0E3C29` / `#17643F` / `#DFE9DF` — scoreboard panels, active states |
| Amber | `#E5A62E` — priority, must-watch, moved |
| Ink / muted ink / line | `#121813` / `#697169` / `#D3CEC0` |
| Display type | Barlow Condensed 600–700 — headlines, times, scores, team names |
| Body type | IBM Plex Sans 400–700 |
| Utility type | IBM Plex Mono 500 — chips, timestamps, freshness |
| Radius | 8px controls, 14px cards, 22px major panels |

Rules: no gradients, no glass, no drop shadows. Games are programme-style listing rows (kickoff column, teams stacked, actions beneath). The only dark surfaces are the hero band and the scoreboard panels. Uncertainty is written in words, not colour alone. Motion is limited to the live pulse dot. Wordmark: WATCH in deep pitch, PLAN in amber.

## Stack

React 19 + TypeScript + Vite. Clean layers:

- `src/data` — teams, leagues, seed fixtures, where-to-watch map
- `src/services` — TheSportsDB client + week merge
- `src/stores` — follows, subscriptions, reminders (localStorage)
- `src/screens` — My Week, Game Detail, Follows, News, Remind, Conflicts, Watch

Soccer first; team records include `leagueId` so NFL / MLB / NBA / NHL can be added later without rewriting the week view.

## Deploy

Static SPA. `vercel.json` and `public/_redirects` rewrite all routes to `index.html`.
