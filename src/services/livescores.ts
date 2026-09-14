import type { Fixture } from '../domain/types'
import { parseUtc } from '../lib/time'
import { fetchLiveFixtures } from './apiFootball'

export interface LiveUpdate {
  fixtureId: string
  homeScore: number | null
  awayScore: number | null
  status: Fixture['status']
  statusDetail: string
  liveMinute?: number
  livePeriod?: string
  updatedAt?: string
}

/** Every game in play right now, as updates keyed by fixture id. Throws NoDataKey when the proxy has no key. */
export async function fetchLiveSoccer(): Promise<LiveUpdate[]> {
  const live = await fetchLiveFixtures()
  return live.map((f) => ({
    fixtureId: f.id,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    status: f.status,
    statusDetail: f.statusDetail ?? 'Live',
    liveMinute: f.liveMinute,
    livePeriod: f.livePeriod,
    updatedAt: f.liveMinuteAt,
  }))
}

/** Overlay live updates onto the week. Only fixtures the feed mentions change. */
export function applyLive(fixtures: Fixture[], updates: LiveUpdate[]): Fixture[] {
  if (updates.length === 0) return fixtures
  const byId = new Map(updates.map((u) => [u.fixtureId, u]))
  let changed = false
  const next = fixtures.map((f) => {
    const u = byId.get(f.id)
    if (!u) return f
    if (
      f.status === u.status &&
      f.homeScore === u.homeScore &&
      f.awayScore === u.awayScore &&
      f.statusDetail === u.statusDetail &&
      f.livePeriod === u.livePeriod
    ) {
      return f
    }
    changed = true
    return { ...f,
      liveMinute: u.liveMinute,
      liveMinuteAt: u.liveMinute !== undefined && u.liveMinute !== f.liveMinute ? new Date().toISOString() : (f.liveMinuteAt ?? new Date().toISOString()),
      livePeriod: u.livePeriod, status: u.status, homeScore: u.homeScore, awayScore: u.awayScore, statusDetail: u.statusDetail }
  })
  return changed ? next : fixtures
}

const BEFORE_MS = 10 * 60 * 1000
const AFTER_MS = 140 * 60 * 1000

/** True when any fixture could plausibly be in play right now — the only time polling is worth a request. */
export function anyInPlay(fixtures: Fixture[], now = new Date()): boolean {
  const t = now.getTime()
  return fixtures.some((f) => {
    if (f.status === 'final') return false
    const k = parseUtc(f.kickoffUtc).getTime()
    return t >= k - BEFORE_MS && t <= k + AFTER_MS
  })
}
