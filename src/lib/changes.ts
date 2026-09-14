import type { Fixture, FixtureChange, SeenMap } from '../domain/types'
import { parseUtc } from './time'

const KEEP_DAYS = 14

function looksPostponed(fixture: Fixture): boolean {
  const detail = (fixture.statusDetail ?? '').toLowerCase()
  return fixture.status === 'postponed' || (fixture.status === 'unknown' && (detail.includes('postpon') || detail.includes('cancel') || detail.includes('abandon')))
}

/**
 * Compare the fixtures we just loaded with the last snapshot.
 * Reports kickoff moves and postponements only — new games entering the
 * window are normal week-to-week churn, not a change worth an alert.
 */
export function diffWeek(prev: SeenMap, fixtures: Fixture[], now = new Date()): FixtureChange[] {
  const detectedAt = now.toISOString()
  const changes: FixtureChange[] = []
  for (const fixture of fixtures) {
    const seen = prev[fixture.id]
    if (!seen) continue
    if (fixture.status === 'final') continue
    if (looksPostponed(fixture) && !looksPostponed({ ...fixture, status: seen.status, statusDetail: seen.statusDetail })) {
      changes.push({ fixtureId: fixture.id, kind: 'postponed', detectedAt })
      continue
    }
    if (seen.kickoffUtc !== fixture.kickoffUtc) {
      changes.push({ fixtureId: fixture.id, kind: 'moved', from: seen.kickoffUtc, to: fixture.kickoffUtc, detectedAt })
    }
  }
  return changes
}

/** Merge the current fixtures into the snapshot and drop anything older than two weeks. */
export function snapshotWeek(prev: SeenMap, fixtures: Fixture[], now = new Date()): SeenMap {
  const cutoff = now.getTime() - KEEP_DAYS * 24 * 60 * 60 * 1000
  const next: SeenMap = {}
  for (const [id, seen] of Object.entries(prev)) {
    if (parseUtc(seen.kickoffUtc).getTime() >= cutoff) next[id] = seen
  }
  for (const fixture of fixtures) {
    next[fixture.id] = {
      kickoffUtc: fixture.kickoffUtc,
      status: fixture.status,
      statusDetail: fixture.statusDetail,
    }
  }
  return next
}

/** Add new changes to the list without repeating one we already have. */
export function mergeChanges(existing: FixtureChange[], incoming: FixtureChange[]): FixtureChange[] {
  const key = (c: FixtureChange) => `${c.fixtureId}|${c.kind}|${c.to ?? ''}`
  const have = new Set(existing.map(key))
  const merged = [...existing]
  for (const change of incoming) {
    if (!have.has(key(change))) {
      merged.push(change)
      have.add(key(change))
    }
  }
  return merged
}
