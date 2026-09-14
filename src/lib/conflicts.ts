import type { Fixture } from '../domain/types'
import { MATCH_LENGTH_MS, overlapMs, parseUtc } from './time'

export interface Conflict {
  a: Fixture
  b: Fixture
  overlapMin: number
}

/** Pairs of upcoming games that overlap by 30 minutes or more. */
export function findConflicts(fixtures: Fixture[]): Conflict[] {
  const upcoming = fixtures.filter((f) => f.status !== 'final')
  const found: Conflict[] = []
  for (let i = 0; i < upcoming.length; i += 1) {
    for (let j = i + 1; j < upcoming.length; j += 1) {
      const a = upcoming[i]
      const b = upcoming[j]
      const a0 = parseUtc(a.kickoffUtc).getTime()
      const b0 = parseUtc(b.kickoffUtc).getTime()
      const overlap = overlapMs(a0, a0 + MATCH_LENGTH_MS, b0, b0 + MATCH_LENGTH_MS)
      if (overlap >= 30 * 60 * 1000) {
        found.push({ a, b, overlapMin: Math.round(overlap / 60000) })
      }
    }
  }
  return found
}
