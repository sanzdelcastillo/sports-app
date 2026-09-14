import { SEED_FIXTURES } from '../data/fixtures.seed'
import { getTeam } from '../data/teams'
import type { DataSource, Fixture } from '../domain/types'
import { involvesTeam, isMustWatch, withInferredStatus } from '../lib/status'
import { readJson, writeJson } from '../lib/storage'
import { isInWindow, parseUtc, weekWindow } from '../lib/time'
import { fetchLeagueEvents, fetchTeamEvents } from './theSportsDb'
import { getLeague, leagueIdFromFollow } from '../data/leagues'

const CACHE_KEY = 'sfp.lastGoodWeek.v1'
const CACHE_KEEP_DAYS = 21

interface LastGood {
  fixtures: Fixture[]
  fetchedAt: string
}

/** The last successful live fetch, kept so an API hiccup never empties the app. */
export function readLastGood(): LastGood | null {
  return readJson<LastGood | null>(CACHE_KEY, null)
}

function writeLastGood(fixtures: Fixture[], fetchedAt: string, now = new Date()): void {
  const cutoff = now.getTime() - CACHE_KEEP_DAYS * 24 * 60 * 60 * 1000
  const kept = fixtures.filter((f) => parseUtc(f.kickoffUtc).getTime() >= cutoff)
  writeJson<LastGood>(CACHE_KEY, { fixtures: kept, fetchedAt })
}

export interface WeekResult {
  fixtures: Fixture[]
  source: DataSource
  fetchedAt: string
  error?: string
}

function dedupe(fixtures: Fixture[]): Fixture[] {
  const map = new Map<string, Fixture>()
  for (const fixture of fixtures) {
    const existing = map.get(fixture.id)
    if (!existing) {
      map.set(fixture.id, fixture)
      continue
    }
    const liveRank = (s: Fixture) =>
      s.status === 'live' ? 2 : s.homeScore !== null || s.awayScore !== null ? 1 : 0
    if (liveRank(fixture) >= liveRank(existing)) map.set(fixture.id, fixture)
  }
  return [...map.values()]
}

/**
 * Merge order matters: dedupe keeps the later entry on ties, so the freshest
 * source goes last (seed → cached → live).
 */
export function favoritesComplete(
  live: Fixture[],
  follows: string[],
  start: Date,
  end: Date,
  cached: Fixture[] = [],
): { fixtures: Fixture[]; usedSeed: boolean } {
  const followed = new Set(follows)
  const inWindow = (f: Fixture) => isInWindow(f.kickoffUtc, start, end)
  const relevant = (f: Fixture) => follows.some((id) => involvesTeam(f, id))

  const merged = dedupe([...SEED_FIXTURES, ...cached, ...live]).filter(relevant)
  const windowed = merged.filter(inWindow)

  const missing = follows.filter(
    (id) => !windowed.some((f) => involvesTeam(f, id)),
  )
  let usedSeed = live.length === 0 && cached.length === 0
  if (missing.length) {
    const extras = dedupe([...SEED_FIXTURES, ...cached]).filter(
      (f) => missing.some((id) => involvesTeam(f, id)) && inWindow(f),
    )
    if (extras.length) usedSeed = true
    windowed.push(...extras)
  }

  const fixtures = dedupe(windowed).map((f) => {
    const inferred = withInferredStatus(f)
    return { ...inferred, mustWatch: isMustWatch(inferred, followed) }
  })

  fixtures.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  return { fixtures, usedSeed }
}

const META_KEY = 'sfp.fetchMeta.v1'
export const AUTO_REFRESH_MS = 10 * 60 * 1000

/** When each followed team's fixtures were last fetched successfully. */
export function readFetchMeta(): Record<string, string> {
  return readJson<Record<string, string>>(META_KEY, {})
}

/** Teams whose data is missing or older than the auto-refresh window. */
export function staleTeams(follows: string[], now = new Date()): string[] {
  const meta = readFetchMeta()
  return follows.filter((id) => {
    const at = meta[id]
    return !at || now.getTime() - new Date(at).getTime() > AUTO_REFRESH_MS
  })
}

/**
 * Load the week for the followed clubs. Only `teamsToFetch` hit the network;
 * everyone else comes from the last saved week, so toggling one club costs two requests, not twenty.
 */
export async function loadFollowedWeek(follows: string[], teamsToFetch: string[] = follows): Promise<WeekResult> {
  const { start, end } = weekWindow()
  const fetchedAt = new Date().toISOString()
  const lastGood = readLastGood()
  const cached = lastGood?.fixtures ?? []

  if (follows.length === 0) {
    return { fixtures: [], source: 'seed', fetchedAt }
  }

  if (teamsToFetch.length === 0 && cached.length > 0) {
    const { fixtures } = favoritesComplete([], follows, start, end, cached)
    return { fixtures, source: 'live', fetchedAt: lastGood?.fetchedAt ?? fetchedAt }
  }

  const fallback = (message: string): WeekResult => {
    const { fixtures } = favoritesComplete([], follows, start, end, cached)
    return {
      fixtures,
      source: cached.length ? 'cached' : 'seed',
      fetchedAt: lastGood?.fetchedAt ?? fetchedAt,
      error: message,
    }
  }

  try {
    const targets = teamsToFetch
      .map((id) => {
        const league = leagueIdFromFollow(id)
        if (league) return { id, sportsDbId: getLeague(league).sportsDbId, kind: 'league' as const }
        return { id, sportsDbId: getTeam(id)?.sportsDbId, kind: 'team' as const }
      })
      .filter((t): t is { id: string; sportsDbId: string; kind: 'league' | 'team' } => Boolean(t.sportsDbId))

    const batches = await Promise.allSettled(
      targets.map((t) => (t.kind === 'league' ? fetchLeagueEvents(t.sportsDbId) : fetchTeamEvents(t.sportsDbId))),
    )
    const live = batches.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )
    const failed = batches.some((result) => result.status === 'rejected')

    const meta = readFetchMeta()
    batches.forEach((result, i) => {
      if (result.status === 'fulfilled') meta[targets[i].id] = fetchedAt
    })
    writeJson(META_KEY, meta)

    if (live.length === 0) {
      return fallback(
        cached.length
          ? 'Live fixtures unavailable — showing your last saved week.'
          : 'Live fixtures unavailable — showing seed week.',
      )
    }

    // Remember everything live we saw, merged over what we had, so a later outage still has data.
    const remembered = dedupe([...cached, ...live])
    writeLastGood(remembered, fetchedAt)

    const { fixtures, usedSeed } = favoritesComplete(live, follows, start, end, cached)
    const source: DataSource = usedSeed || failed ? 'mixed' : 'live'

    return { fixtures, source, fetchedAt }
  } catch (error) {
    return fallback(error instanceof Error ? error.message : 'Live fixtures unavailable')
  }
}

export function fixtureById(id: string, pool: Fixture[]): Fixture | undefined {
  return pool.find((f) => f.id === id) ?? SEED_FIXTURES.find((f) => f.id === id)
}

/** First paint before any fetch: last saved week if we have one, otherwise the bundled seed. */
export function seedWeek(follows: string[]): Fixture[] {
  const { start, end } = weekWindow()
  return favoritesComplete([], follows, start, end, readLastGood()?.fixtures ?? []).fixtures
}
