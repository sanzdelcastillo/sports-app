import type { Fixture, FixtureStatus } from '../domain/types'
import { MATCH_LENGTH_MS, parseUtc } from './time'

export function inferStatus(fixture: Fixture, now = new Date()): FixtureStatus {
  if (fixture.status === 'final') return 'final'
  if (fixture.status === 'live') return 'live'
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

export function scoreLabel(score: number | null, status: FixtureStatus): string {
  if (score === null || status === 'scheduled') return '—'
  return String(score)
}

export function involvesTeam(fixture: Fixture, teamId: string): boolean {
  return fixture.homeTeamId === teamId || fixture.awayTeamId === teamId
}

export function followedSides(fixture: Fixture, follows: Set<string>): string[] {
  return [fixture.homeTeamId, fixture.awayTeamId].filter((id) => follows.has(id))
}

export function isMustWatch(fixture: Fixture, follows: Set<string>): boolean {
  if (fixture.mustWatch) return true
  return followedSides(fixture, follows).length >= 2
}
