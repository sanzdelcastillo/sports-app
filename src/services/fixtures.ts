import { SEED_FIXTURES } from '../data/fixtures.seed'
import { getTeam } from '../data/teams'
import type { DataSource, Fixture } from '../domain/types'
import { involvesTeam, isMustWatch, withInferredStatus } from '../lib/status'
import { isInWindow, weekWindow } from '../lib/time'
import { fetchTeamEvents } from './theSportsDb'

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

function favoritesComplete(
  live: Fixture[],
  follows: string[],
  start: Date,
  end: Date,
): { fixtures: Fixture[]; usedSeed: boolean } {
  const followed = new Set(follows)
  const inWindow = (f: Fixture) => isInWindow(f.kickoffUtc, start, end)
  const relevant = (f: Fixture) => follows.some((id) => involvesTeam(f, id))

  const merged = dedupe([...live, ...SEED_FIXTURES]).filter(relevant)
  const windowed = merged.filter(inWindow)

  const missing = follows.filter(
    (id) => !windowed.some((f) => involvesTeam(f, id)),
  )
  let usedSeed = live.length === 0
  if (missing.length) {
    const extras = SEED_FIXTURES.filter(
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

export async function loadFollowedWeek(follows: string[]): Promise<WeekResult> {
  const { start, end } = weekWindow()
  const fetchedAt = new Date().toISOString()

  if (follows.length === 0) {
    return { fixtures: [], source: 'seed', fetchedAt }
  }

  try {
    const sportsDbIds = follows
      .map((id) => getTeam(id)?.sportsDbId)
      .filter((id): id is string => Boolean(id))

    const batches = await Promise.allSettled(sportsDbIds.map((id) => fetchTeamEvents(id)))
    const live = batches.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )
    const failed = batches.some((result) => result.status === 'rejected')
    const { fixtures, usedSeed } = favoritesComplete(live, follows, start, end)

    let source: DataSource = 'live'
    if (live.length === 0) source = 'seed'
    else if (usedSeed || failed) source = 'mixed'

    return {
      fixtures,
      source,
      fetchedAt,
      error: failed && live.length === 0 ? 'Live fixtures unavailable — showing seed week.' : undefined,
    }
  } catch (error) {
    const { fixtures } = favoritesComplete([], follows, start, end)
    return {
      fixtures,
      source: 'seed',
      fetchedAt,
      error: error instanceof Error ? error.message : 'Live fixtures unavailable',
    }
  }
}

export function fixtureById(id: string, pool: Fixture[]): Fixture | undefined {
  return pool.find((f) => f.id === id) ?? SEED_FIXTURES.find((f) => f.id === id)
}

export function seedWeek(follows: string[]): Fixture[] {
  const { start, end } = weekWindow()
  return favoritesComplete([], follows, start, end).fixtures
}
