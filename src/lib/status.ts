import type { Fixture, FixtureStatus } from '../domain/types'
import { MATCH_LENGTH_MS, parseUtc } from './time'

export function inferStatus(fixture: Fixture, now = new Date()): FixtureStatus {
  if (fixture.status === 'final') return 'final'
  if (fixture.status === 'live') return 'live'
  if (fixture.status === 'postponed') return 'postponed'
  const start = parseUtc(fixture.kickoffUtc).getTime()
  const t = now.getTime()
  if (t >= start && t <= start + MATCH_LENGTH_MS) return 'live'
  if (t > start + MATCH_LENGTH_MS) return 'final'
  return fixture.status
}

export function withInferredStatus(fixture: Fixture, now = new Date()): Fixture {
  const status = inferStatus(fixture, now)
  if (status === fixture.status) return fixture
  return { ...fixture, status }
}

/** Scoreboard digits. A live game with no score yet reads 0, not a blank — nothing is "missing". */
export function scoreLabel(score: number | null, status: FixtureStatus): string {
  if (status === 'scheduled') return '—'
  if (score === null) return status === 'live' ? '0' : '—'
  return String(score)
}

/** True when a follow id (a club, or a whole competition as `league:<id>`) covers this fixture. */
export function involvesTeam(fixture: Fixture, followId: string): boolean {
  if (followId.startsWith('league:')) return fixture.leagueId === followId.slice(7)
  return fixture.homeTeamId === followId || fixture.awayTeamId === followId
}

export function followedSides(fixture: Fixture, follows: Set<string>): string[] {
  return [fixture.homeTeamId, fixture.awayTeamId].filter((id) => follows.has(id))
}

export function isMustWatch(fixture: Fixture, follows: Set<string>): boolean {
  if (fixture.mustWatch) return true
  return followedSides(fixture, follows).length >= 2
}
