import { leagueFromSportsDb } from '../data/leagues'
import { resolveTeam, TEAM_BY_SPORTSDB } from '../data/teams'
import type { Fixture, FixtureStatus, Team } from '../domain/types'

const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

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
  idHomeTeam?: string
  idAwayTeam?: string
  intHomeScore?: string | null
  intAwayScore?: string | null
  strStatus?: string | null
  strVenue?: string | null
  strProgress?: string | null
}

function toIso(event: SportsDbEvent): string | null {
  if (event.strTimestamp) {
    const d = new Date(event.strTimestamp)
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

function teamFromEvent(id?: string, name?: string): Team | undefined {
  if (id && TEAM_BY_SPORTSDB[id]) return TEAM_BY_SPORTSDB[id]
  if (name) return resolveTeam(name)
  return undefined
}

export function mapEvent(event: SportsDbEvent): Fixture | null {
  const home = teamFromEvent(event.idHomeTeam, event.strHomeTeam)
  const away = teamFromEvent(event.idAwayTeam, event.strAwayTeam)
  const kickoffUtc = toIso(event)
  if (!home || !away || !kickoffUtc || !event.idEvent) return null

  const leagueId = leagueFromSportsDb(event.idLeague, event.strLeague)
  const leagueName =
    leagueId === 'ucl'
      ? 'UEFA Champions League'
      : leagueId === 'mls'
        ? 'MLS'
        : event.strLeague || 'Soccer'

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
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}`)
  return (await res.json()) as T
}

export async function fetchTeamEvents(sportsDbId: string): Promise<Fixture[]> {
  const [next, last] = await Promise.all([
    getJson<{ events: SportsDbEvent[] | null }>(`${BASE}/eventsnext.php?id=${sportsDbId}`),
    getJson<{ results: SportsDbEvent[] | null }>(`${BASE}/eventslast.php?id=${sportsDbId}`),
  ])
  const raw = [...(next.events ?? []), ...(last.results ?? [])]
  return raw.map(mapEvent).filter((f): f is Fixture => f !== null)
}
