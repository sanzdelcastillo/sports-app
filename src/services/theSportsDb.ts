import { LEAGUES, leagueFromSportsDb } from '../data/leagues'
import { registerTeams, resolveTeam, teamBySportsDb } from '../data/teams'
import { teamFromFeed } from './clubs'
import type { Fixture, FixtureStatus, Team, LeagueId } from '../domain/types'

/**
 * All calls go through our proxy so the premium key stays on the server.
 * In the browser the proxy is same-origin; the native shell needs the deployed site's URL (VITE_API_BASE).
 */
const API_ORIGIN = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '')
export const V1 = `${API_ORIGIN}/api/sportsdb/v1`
export const V2 = `${API_ORIGIN}/api/sportsdb/v2`
const BASE = V1

interface SportsDbEvent {
  idEvent?: string
  dateEvent?: string
  strTime?: string
  strTimestamp?: string
  strEvent?: string
  strLeague?: string
  idLeague?: string
  strHomeTeam?: string
  strAwayTeam?: string
  strHomeTeamBadge?: string | null
  strAwayTeamBadge?: string | null
  idHomeTeam?: string
  idAwayTeam?: string
  intHomeScore?: string | null
  intAwayScore?: string | null
  strStatus?: string | null
  strVenue?: string | null
  strProgress?: string | null
  strSeason?: string | null
}

function toIso(event: SportsDbEvent): string | null {
  if (event.strTimestamp) {
    // The feed's timestamps are UTC but carry no zone marker; without the Z a browser would read them as local time.
    const stamp = /[zZ]|[+-]\d\d:?\d\d$/.test(event.strTimestamp) ? event.strTimestamp : `${event.strTimestamp}Z`
    const d = new Date(stamp)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  if (!event.dateEvent) return null
  const time = (event.strTime || '00:00:00').slice(0, 8)
  const d = new Date(`${event.dateEvent}T${time}Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function mapStatus(raw?: string | null): FixtureStatus {
  const s = (raw ?? '').toUpperCase()
  if (!s || s === 'NS' || s === 'NOT STARTED' || s === 'TBD') return 'scheduled'
  if (s === 'FT' || s === 'AET' || s === 'PEN' || s === 'FT_PEN' || s === 'AOT') return 'final'
  if (
    s === 'LIVE' ||
    s === '1H' ||
    s === '2H' ||
    s === 'HT' ||
    s === 'ET' ||
    s === 'P' ||
    s.includes('IN PLAY')
  ) {
    return 'live'
  }
  return 'unknown'
}

function parseScore(value?: string | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Resolve a club from an event. Unknown clubs (a cup opponent from a lower league, say) are created
 * from the event itself so every game shows two real names, and remembered for next time.
 */
function teamFromEvent(id: string | undefined, name: string | undefined, badge: string | undefined, leagueId: LeagueId): Team | undefined {
  if (id) {
    const known = teamBySportsDb(id)
    if (known) return known
  }
  if (name) {
    const byName = resolveTeam(name)
    if (byName) return byName
  }
  if (!id || !name) return undefined
  const created = teamFromFeed({ idTeam: id, strTeam: name, strBadge: badge ?? null }, leagueId) ?? undefined
  if (created) registerTeams([created])
  return created
}

export function mapEvent(event: SportsDbEvent): Fixture | null {
  const leagueId = leagueFromSportsDb(event.idLeague, event.strLeague)
  const home = teamFromEvent(event.idHomeTeam, event.strHomeTeam, event.strHomeTeamBadge ?? undefined, leagueId)
  const away = teamFromEvent(event.idAwayTeam, event.strAwayTeam, event.strAwayTeamBadge ?? undefined, leagueId)
  const kickoffUtc = toIso(event)
  if (!home || !away || !kickoffUtc || !event.idEvent) return null

  const leagueName = leagueId === 'other' ? event.strLeague || 'Soccer' : LEAGUES[leagueId].name

  return {
    id: event.idEvent,
    leagueId,
    leagueName,
    kickoffUtc,
    venue: event.strVenue || home.stadium,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore: parseScore(event.intHomeScore),
    awayScore: parseScore(event.intAwayScore),
    status: mapStatus(event.strStatus),
    statusDetail: event.strProgress || event.strStatus || undefined,
    season: event.strSeason || undefined,
  }
}

/** The free tier allows roughly 30 requests a minute, so requests are spaced out and 429s retried once. */
const GAP_MS = 120
let chain: Promise<unknown> = Promise.resolve()

function spaced<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(() => new Promise<void>((r) => setTimeout(r, GAP_MS))).then(task)
  chain = run.catch(() => undefined)
  return run
}

export class RateLimited extends Error {
  constructor() {
    super('The data source is busy right now')
    this.name = 'RateLimited'
  }
}

/** The proxy answers 503 for premium-only endpoints when no key is configured. */
export class NoPremiumKey extends Error {
  constructor() {
    super('Premium data source key not configured')
    this.name = 'NoPremiumKey'
  }
}

export async function getJson<T>(url: string, retry = true): Promise<T> {
  return spaced(async () => {
    const res = await fetch(url)
    if (res.status === 429) {
      if (retry) {
        await new Promise((r) => setTimeout(r, 2500))
        return getJson<T>(url, false)
      }
      throw new RateLimited()
    }
    if ([400, 401, 403, 503].includes(res.status) && url.startsWith(V2)) throw new NoPremiumKey()
    if (!res.ok) throw new Error(`TheSportsDB ${res.status}`)
    return (await res.json()) as T
  })
}

export async function fetchTeamEvents(sportsDbId: string): Promise<Fixture[]> {
  const [next, last] = await Promise.all([
    getJson<{ events: SportsDbEvent[] | null }>(`${BASE}/eventsnext?id=${sportsDbId}`),
    getJson<{ results: SportsDbEvent[] | null }>(`${BASE}/eventslast?id=${sportsDbId}`),
  ])
  const raw = [...(next.events ?? []), ...(last.results ?? [])]
  return raw.map(mapEvent).filter((f): f is Fixture => f !== null)
}
