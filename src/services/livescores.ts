import type { Fixture } from '../domain/types'
import { parseUtc } from '../lib/time'
import { getJson, V2 } from './theSportsDb'

interface RawLive {
  idEvent?: string
  intHomeScore?: string | null
  intAwayScore?: string | null
  strStatus?: string | null
  strProgress?: string | null
  updated?: string | null
}

export interface LiveUpdate {
  fixtureId: string
  homeScore: number | null
  awayScore: number | null
  status: Fixture['status']
  statusDetail: string
  updatedAt?: string
}

const FINAL = new Set(['FT', 'AET', 'PEN', 'FINISHED', 'MATCH FINISHED'])
const NOT_STARTED = new Set(['NS', 'TBD', 'NOT STARTED'])

function num(value?: string | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Human label for the scoreboard: "45'", "HT", "90+3'", "FT". */
function detailFor(status: string, progress: string): string {
  const s = status.toUpperCase()
  if (s === 'HT') return 'HT'
  if (FINAL.has(s)) return 'FT'
  if (progress && /^\d+/.test(progress)) return `${progress}'`
  return status || 'Live'
}

export function mapLive(raw: RawLive[]): LiveUpdate[] {
  return raw
    .filter((r): r is RawLive & { idEvent: string } => Boolean(r.idEvent))
    .map((r) => {
      const status = (r.strStatus ?? '').trim()
      const s = status.toUpperCase()
      return {
        fixtureId: r.idEvent,
        homeScore: num(r.intHomeScore),
        awayScore: num(r.intAwayScore),
        status: FINAL.has(s) ? 'final' : NOT_STARTED.has(s) ? 'scheduled' : 'live',
        statusDetail: detailFor(status, (r.strProgress ?? '').trim()),
        updatedAt: r.updated ?? undefined,
      }
    })
}

/** Current soccer livescores (premium). Throws NoPremiumKey when the proxy has no key. */
export async function fetchLiveSoccer(): Promise<LiveUpdate[]> {
  const data = await getJson<{ livescore: RawLive[] | null }>(`${V2}/livescore/soccer`)
  return mapLive(data.livescore ?? [])
}

/** Overlay live updates onto the week. Only fixtures the feed mentions change. */
export function applyLive(fixtures: Fixture[], updates: LiveUpdate[]): Fixture[] {
  if (updates.length === 0) return fixtures
  const byId = new Map(updates.map((u) => [u.fixtureId, u]))
  let changed = false
  const next = fixtures.map((f) => {
    const u = byId.get(f.id)
    if (!u) return f
    if (f.status === u.status && f.homeScore === u.homeScore && f.awayScore === u.awayScore && f.statusDetail === u.statusDetail) {
      return f
    }
    changed = true
    return { ...f, status: u.status, homeScore: u.homeScore, awayScore: u.awayScore, statusDetail: u.statusDetail }
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
