/**
 * API-Football (api-sports.io v3) adapter. Everything match-related comes from here:
 * fixtures, live scores and clocks, lineups, events, statistics, standings, clubs, leagues.
 * All calls go through /api/football so the key stays on the server.
 */
import { getLeague, leagueFromProvider } from '../data/leagues'
import { registerTeams, teamByProviderId } from '../data/teams'
import type { Fixture, FixtureStatus, League, LeagueId, Team } from '../domain/types'

export const API_ORIGIN = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '')
export const AF = `${API_ORIGIN}/api/football`
export const PLAYER_PHOTO = (id: number | string) => `https://media.api-sports.io/football/players/${id}.png`

/* ---------- transport ---------- */

export class RateLimited extends Error {
  constructor() {
    super('The data source is busy')
    this.name = 'RateLimited'
  }
}
export class NoDataKey extends Error {
  constructor() {
    super('Football data key not configured')
    this.name = 'NoDataKey'
  }
}

interface Envelope<T> {
  errors?: Record<string, string> | unknown[]
  results?: number
  response?: T
}

let queue: Promise<unknown> = Promise.resolve()
const SPACING_MS = 80

export function getJson<T>(url: string, retry = true): Promise<T> {
  const run = async (): Promise<T> => {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (res.status === 429) {
      if (retry) {
        await new Promise((r) => setTimeout(r, 1500))
        return getJson<T>(url, false)
      }
      throw new RateLimited()
    }
    if (res.status === 503) throw new NoDataKey()
    if (!res.ok) throw new Error(`Football data ${res.status}`)
    const data = (await res.json()) as Envelope<T>
    const errs = data.errors
    if (errs && !Array.isArray(errs) && Object.keys(errs).length) {
      const msg = Object.values(errs)[0]
      if (/limit|rate/i.test(String(msg))) throw new RateLimited()
      throw new Error(String(msg))
    }
    return (data.response ?? ([] as unknown)) as T
  }
  const next = queue.then(() => new Promise((r) => setTimeout(r, SPACING_MS))).then(run)
  queue = next.catch(() => undefined)
  return next
}

/* ---------- raw shapes (only the fields we read) ---------- */

export interface AfFixture {
  fixture: {
    id: number
    date: string
    timestamp?: number
    periods?: { first: number | null; second: number | null }
    venue?: { id: number | null; name: string | null; city: string | null }
    status: { long: string; short: string; elapsed: number | null; extra?: number | null }
  }
  league: { id: number; name: string; country: string; logo?: string; season: number; round?: string }
  teams: { home: AfTeamRef; away: AfTeamRef }
  goals: { home: number | null; away: number | null }
  score?: { penalty?: { home: number | null; away: number | null } }
}

export interface AfTeamRef {
  id: number
  name: string
  logo?: string
  winner?: boolean | null
}

export interface AfTeamEntry {
  team: { id: number; name: string; code: string | null; country: string | null; logo: string | null }
  venue?: { name: string | null }
}

export interface AfLeagueEntry {
  league: { id: number; name: string; type: string; logo?: string }
  country: { name: string; code: string | null }
  seasons: { year: number; current: boolean }[]
}

/* ---------- status mapping ---------- */

const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE', 'SUSP'])
const FINAL = new Set(['FT', 'AET', 'PEN'])
const SCHEDULED = new Set(['TBD', 'NS'])
const OFF = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO'])

export function statusOf(short: string): FixtureStatus {
  if (LIVE.has(short)) return 'live'
  if (FINAL.has(short)) return 'final'
  if (OFF.has(short)) return 'postponed'
  return SCHEDULED.has(short) ? 'scheduled' : 'scheduled'
}

function detailOf(short: string, elapsed: number | null, extra?: number | null): string | undefined {
  if (short === 'HT') return 'HT'
  if (short === 'FT') return 'FT'
  if (short === 'AET') return 'AET'
  if (short === 'PEN') return 'Pens'
  if (short === 'PST') return 'Postponed'
  if (short === 'CANC') return 'Cancelled'
  if (short === 'ABD') return 'Abandoned'
  if (short === 'TBD') return 'Time TBD'
  if (LIVE.has(short) && elapsed !== null) return extra ? `${elapsed}+${extra}'` : `${elapsed}'`
  return undefined
}

/* ---------- teams ---------- */

function shortCode(name: string, code: string | null | undefined): string {
  const given = (code ?? '').trim().toUpperCase()
  if (given) return given.slice(0, 4)
  const cleaned = name.replace(/\b(FC|CF|SC|AFC|CD|UD|SD|AC|AS|SS|US|RC|RCD|Club|United|City)\b/g, '').replace(/[^A-Za-z ]/g, '').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length >= 3) return words.map((w) => w[0]).join('').toUpperCase().slice(0, 3)
  return (words[0] ?? name).slice(0, 3).toUpperCase()
}

/** A club record from any provider object with an id/name/logo; existing core clubs keep their identity. */
export function teamFromProvider(ref: { id: number; name: string; code?: string | null; logo?: string | null; country?: string | null; venue?: string | null }, leagueId: LeagueId = 'other'): Team {
  const providerId = String(ref.id)
  const existing = teamByProviderId(providerId)
  if (existing) return existing
  const team: Team = {
    id: `t${providerId}`,
    name: ref.name,
    shortName: shortCode(ref.name, ref.code),
    leagueId,
    country: ref.country ?? '',
    stadium: ref.venue ?? '',
    badgeUrl: ref.logo ?? '',
    providerId,
    color: '#17643F',
    colorSecondary: '#FBF8F0',
    followable: true,
  }
  registerTeams([team])
  return team
}

/* ---------- fixtures ---------- */

export function mapFixture(f: AfFixture): Fixture | null {
  if (!f?.fixture?.id || !f.teams?.home?.id || !f.teams?.away?.id) return null
  const league = leagueFromProvider(String(f.league.id), f.league.name, f.league.country)
  const leagueId = league.id
  const home = teamFromProvider(f.teams.home, leagueId)
  const away = teamFromProvider(f.teams.away, leagueId)
  const short = f.fixture.status.short
  const status = statusOf(short)
  const kickoffUtc = new Date(f.fixture.date).toISOString()
  return {
    id: String(f.fixture.id),
    leagueId,
    leagueName: getLeague(leagueId).name,
    kickoffUtc,
    venue: f.fixture.venue?.name ?? '',
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    status,
    statusDetail: detailOf(short, f.fixture.status.elapsed, f.fixture.status.extra),
    liveMinute: status === 'live' && f.fixture.status.elapsed !== null ? f.fixture.status.elapsed : undefined,
    liveMinuteAt: status === 'live' ? new Date().toISOString() : undefined,
    livePeriod: status === 'live' ? short : undefined,
    season: String(f.league.season),
    round: f.league.round ?? undefined,
  }
}

/** A club's next games and a few recent results. No season needed, so it works in every league's calendar. */
export async function fetchTeamFixtures(providerId: string): Promise<Fixture[]> {
  const [next, last] = await Promise.all([
    getJson<AfFixture[]>(`${AF}/fixtures?team=${providerId}&next=15`),
    getJson<AfFixture[]>(`${AF}/fixtures?team=${providerId}&last=8`),
  ])
  return [...last, ...next].map(mapFixture).filter((f): f is Fixture => f !== null)
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Every game in a competition inside a date window. */
export async function fetchLeagueFixtures(league: League, from: Date, to: Date): Promise<Fixture[]> {
  if (!league.providerId) return []
  const season = league.currentSeason ?? seasonGuess(from)
  const rows = await getJson<AfFixture[]>(`${AF}/fixtures?league=${league.providerId}&season=${season}&from=${ymd(from)}&to=${ymd(to)}`)
  return rows.map(mapFixture).filter((f): f is Fixture => f !== null)
}

/** European-style seasons are named by their starting year; a July cut-over is right for most of the world. */
export function seasonGuess(d = new Date()): number {
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1
}

/** One game by id — for shared links opened by someone who doesn't follow either club. */
export async function fetchFixtureById(id: string): Promise<Fixture | null> {
  if (!/^\d+$/.test(id)) return null
  const rows = await getJson<AfFixture[]>(`${AF}/fixtures?id=${id}`)
  return rows.map(mapFixture).find((f): f is Fixture => f !== null) ?? null
}

/** Several games by id in one request (the provider takes up to 20 dash-separated ids). */
export async function fetchFixturesByIds(ids: string[]): Promise<Fixture[]> {
  const clean = [...new Set(ids.filter((id) => /^\d+$/.test(id)))]
  const out: Fixture[] = []
  for (let i = 0; i < clean.length; i += 20) {
    const rows = await getJson<AfFixture[]>(`${AF}/fixtures?ids=${clean.slice(i, i + 20).join('-')}`)
    out.push(...rows.map(mapFixture).filter((f): f is Fixture => f !== null))
  }
  return out
}

/** Everything in play right now, one request for the whole world. */
export async function fetchLiveFixtures(): Promise<Fixture[]> {
  const rows = await getJson<AfFixture[]>(`${AF}/fixtures?live=all`)
  return rows.map(mapFixture).filter((f): f is Fixture => f !== null)
}

/* ---------- clubs and leagues ---------- */

export async function fetchLeagueTeams(league: League): Promise<Team[]> {
  if (!league.providerId) return []
  const season = league.currentSeason ?? seasonGuess()
  const rows = await getJson<AfTeamEntry[]>(`${AF}/teams?league=${league.providerId}&season=${season}`)
  return rows.map((r) => teamFromProvider({ ...r.team, venue: r.venue?.name ?? null }, league.id))
}

export async function searchTeams(query: string): Promise<Team[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const rows = await getJson<AfTeamEntry[]>(`${AF}/teams?search=${encodeURIComponent(q)}`)
  return rows
    .filter((r) => !/\b(W|U1\d|U2\d|II|B|Reserves?|Youth)\b/.test(r.team.name))
    .slice(0, 30)
    .map((r) => teamFromProvider({ ...r.team, venue: r.venue?.name ?? null }))
}

export interface LeagueDirectoryEntry {
  id: string
  name: string
  country: string
  type: 'League' | 'Cup'
  season: number | null
}

export async function fetchLeagueDirectory(): Promise<LeagueDirectoryEntry[]> {
  const rows = await getJson<AfLeagueEntry[]>(`${AF}/leagues`)
  return rows.map((r) => {
    const current = r.seasons.find((s) => s.current) ?? r.seasons[r.seasons.length - 1]
    return {
      id: String(r.league.id),
      name: r.league.name,
      country: r.country.name,
      type: r.league.type === 'Cup' ? 'Cup' : 'League',
      season: current?.year ?? null,
    }
  })
}
