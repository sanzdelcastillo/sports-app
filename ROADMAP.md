# Pitchside — roadmap

Working order. Each item moves to "Done" with the date when it ships.

## Now (web test period)
- [ ] Julio tests the web app daily; collect the "hm" list (confusing moments, unused features, missing features, data gaps by club + date)
- [ ] Rights map: fill U.S. destinations for the popular non-European leagues as they're confirmed (Argentina, Saudi, Belgium, Denmark…)
- [ ] Name clearance for "Pitchside": App Store, Google Play, USPTO, .app/.com, Instagram/X handles — keep a second name ready

## Before store submission
- [ ] Apple Developer enrollment ($99/yr) → Xcode → run on Julio's iPhone → TestFlight with client + a few fans (MAC-SETUP.md)
- [ ] Vercel Pro ($20/mo) — Hobby plan is not allowed for commercial use
- [ ] News license or licensed news API (~$50/mo) — free RSS is for personal use only
- [ ] Privacy policy + Terms of Service (drafts by Claude, lawyer review)
- [ ] LLC, support email, feedback address in Settings
- [ ] Decide crest/photo policy for the store build (text badges toggle exists)
- [ ] Store listing: screenshots, description, age rating, data-sources page

## Launch (v1 in stores)
- [ ] Free / Plus split — agreed: Free = up to 3 clubs, week view, where to watch, calendar export. Plus ≈ $19.99/yr or $2.99/mo = unlimited clubs + competitions, live scores/clock, Match tab, lineups/tables, alerts, catch-up mode
- [ ] In-app purchases via RevenueCat (Apple/Google billing)
- [ ] Goal alerts (push) — needs the Supabase backend
- [ ] Analytics for the actions that matter: reveal-score, open-live, must-watch, share, calendar

## After launch — social, in two stages (private, friends-only; no public feed or chat — decided Sep 2026)
- [ ] Stage 1: private watch parties — pick a game, invite by link, RSVP, everyone locks a score prediction, emoji reactions during the game. Requires accounts (Sign in with Apple/Google), Supabase, push, report/block, ToS. ~3–4 weeks
- [ ] Stage 2: friends leaderboard over the season for predictions; party history; "who's watching what this weekend" among friends
- Never: public posting, public chat, comments on games or news

## Later
- [ ] Lock-screen Live Activities and home-screen widgets (native, Swift/Kotlin)
- [ ] Accounts + sync across devices (replaces the setup code)
- [ ] Player ratings, xG momentum, text commentary — only with a paid data tier once revenue justifies it
- [ ] Head-to-head and form on the game page
- [ ] Spanish-language UI

## Done
- 2026-09-14 — Share this game: card + text into any chat with your score call; guest game links open for anyone in their own time zone
- 2026-09-14 — Consumer product: onboarding, any club/league/competition, device time zone, Settings/About, cups mapped
- 2026-09-14 — Pitchside name + corner-flag mark; brand kit
- 2026-09-14 — Native shell (Capacitor): kickoff alerts, share sheet, durable storage, icons/splash
- 2026-09-14 — Live on Vercel; GitHub → Vercel auto-deploys
- 2026-09-14 — News tab (BBC Sport + Sky Sports headlines, filtered to your clubs)
- 2026-09-14 — Data provider moved to API-Football: live clock, events, stats, lineups on a pitch, tables, world-wide clubs and ~1,200 leagues
