import { LEAGUES } from '../data/leagues'
import type { Fixture, LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { getJson, V1, V2 } from './theSportsDb'

const BASE = V1

export type LineupSlot = 'GK' | 'DEF' | 'MID' | 'FWD' | 'SUB'

export interface LineupPlayer {
  id: string
  name: string
  number: number | null
  slot: LineupSlot
  cutoutUrl?: string
}

export interface TeamLineup {
  starters: LineupPlayer[]
  bench: LineupPlayer[]
  /** Counted from starters' positions, e.g. "4-3-3". Approximate — the source has no formation field. */
  shape: string | null
}

export interface MatchLineup {
  home: TeamLineup
  away: TeamLineup
  fetchedAt: string
}

export interface StandingRow {
  teamSportsDbId: string
  team: string
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  goalDiff: number
  points: number
  /** Most recent last, e.g. "WWDLW". */
  form: string
  note?: string
  badgeUrl?: string
}

export interface LeagueTable {
  leagueId: LeagueId
  season: string
  rows: StandingRow[]
  fetchedAt: string
}

interface RawLineup {
  idPlayer?: string
  strPlayer?: string
  strPosition?: string
  strHome?: string
  strSubstitute?: string
  intSquadNumber?: string | null
  strCutout?: string | null
}

interface RawTableRow {
  idTeam?: string
  strTeam?: string
  intRank?: string
  intPlayed?: string
  intWin?: string
  intDraw?: string
  intLoss?: string
  intGoalDifference?: string
  intPoints?: string
  strForm?: string | null
  strDescription?: string | null
  strBadge?: string | null
}

const LINEUP_TTL_MS = 10 * 60 * 1000
const TABLE_TTL_MS = 60 * 60 * 1000

function slotFor(position?: string): LineupSlot {
  const p = (position ?? '').toLowerCase()
  if (p.includes('goal')) return 'GK'
  if (p.includes('def') || p.includes('back')) return 'DEF'
  if (p.includes('mid')) return 'MID'
  if (p.includes('for') || p.includes('striker') || p.includes('wing') || p.includes('attack')) return 'FWD'
  return 'MID'
}

const SLOT_ORDER: Record<LineupSlot, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3, SUB: 4 }

function toInt(value?: string | null): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** "4-3-3" from the starters' positions; null if the eleven isn't complete. */
export function shapeOf(starters: LineupPlayer[]): string | null {
  if (starters.length !== 11) return null
  const count = (slot: LineupSlot) => starters.filter((p) => p.slot === slot).length
  const gk = count('GK')
  if (gk !== 1) return null
  return [count('DEF'), count('MID'), count('FWD')].join('-')
}

export function groupLineup(raw: RawLineup[]): { home: TeamLineup; away: TeamLineup } {
  const side = (home: boolean): TeamLineup => {
    const players = raw
      .filter((r) => (r.strHome ?? '').toLowerCase() === (home ? 'yes' : 'no'))
      .map<LineupPlayer>((r) => ({
        id: r.idPlayer ?? `${r.strPlayer}-${r.intSquadNumber}`,
        name: r.strPlayer ?? 'Unknown',
        number: r.intSquadNumber ? toInt(r.intSquadNumber) : null,
        slot: (r.strSubstitute ?? '').toLowerCase() === 'yes' ? 'SUB' : slotFor(r.strPosition),
        cutoutUrl: r.strCutout ?? undefined,
      }))
    const starters = players
      .filter((p) => p.slot !== 'SUB')
      .sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot] || (a.number ?? 99) - (b.number ?? 99))
    const bench = players.filter((p) => p.slot === 'SUB').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
    return { starters, bench, shape: shapeOf(starters) }
  }
  return { home: side(true), away: side(false) }
}

/** "2026-2027" for European calendars, "2026" for MLS. Used only when the fixture has no season label. */
export function seasonFor(leagueId: LeagueId, kickoffUtc: string): string {
  const d = new Date(kickoffUtc)
  const y = d.getUTCFullYear()
  if (leagueId === 'mls') return String(y)
  return d.getUTCMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

function fresh(fetchedAt: string, ttl: number): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < ttl
}

export async function fetchLineup(fixture: Fixture): Promise<MatchLineup | null> {
  const key = `sfp.lineup.${fixture.id}`
  const cached = readJson<MatchLineup | null>(key, null)
  // A finished match's lineup won't change; a scheduled one might, so re-check every few minutes.
  if (cached && (fixture.status === 'final' || fresh(cached.fetchedAt, LINEUP_TTL_MS))) return cached

  const data = await getJson<{ lineup: RawLineup[] | null }>(`${BASE}/lookuplineup.php?id=${fixture.id}`)
  const raw = data.lineup ?? []
  if (raw.length === 0) return cached
  const grouped = groupLineup(raw)
  const result: MatchLineup = { ...grouped, fetchedAt: new Date().toISOString() }
  writeJson(key, result)
  return result
}

export async function fetchTable(fixture: Fixture): Promise<LeagueTable | null> {
  const league = LEAGUES[fixture.leagueId]
  if (!league.sportsDbId) return null
  const season = fixture.season ?? seasonFor(fixture.leagueId, fixture.kickoffUtc)
  const key = `sfp.table.${fixture.leagueId}.${season}`
  const cached = readJson<LeagueTable | null>(key, null)
  if (cached && fresh(cached.fetchedAt, TABLE_TTL_MS)) return cached

  const data = await getJson<{ table: RawTableRow[] | null }>(
    `${BASE}/lookuptable.php?l=${league.sportsDbId}&s=${encodeURIComponent(season)}`,
  )
  const rows = (data.table ?? [])
    .map<StandingRow>((r) => ({
      teamSportsDbId: r.idTeam ?? '',
      team: r.strTeam ?? '',
      rank: toInt(r.intRank),
      played: toInt(r.intPlayed),
      won: toInt(r.intWin),
      drawn: toInt(r.intDraw),
      lost: toInt(r.intLoss),
      goalDiff: toInt(r.intGoalDifference),
      points: toInt(r.intPoints),
      form: (r.strForm ?? '').replace(/[^WDL]/g, ''),
      note: r.strDescription ?? undefined,
      badgeUrl: r.strBadge ?? undefined,
    }))
    .sort((a, b) => a.rank - b.rank)
  if (rows.length === 0) return cached
  const result: LeagueTable = { leagueId: fixture.leagueId, season, rows, fetchedAt: new Date().toISOString() }
  writeJson(key, result)
  return result
}

/* ---------- TV listings ---------- */

export interface TvListing {
  country: string
  channel: string
  /** Local kickoff time as given by the source, e.g. "14:00:00" — informational only. */
  time?: string
  logoUrl?: string
  /** Heuristic from the channel name; the source has no language field. */
  language: 'en' | 'es' | 'other'
}

export interface TvListings {
  us: TvListing[]
  fetchedAt: string
}

interface RawTv {
  strCountry?: string | null
  strChannel?: string | null
  strTime?: string | null
  strLogo?: string | null
}

const TV_TTL_MS = 60 * 60 * 1000
const SPANISH = ['telemundo', 'univision', 'tudn', 'vix', 'deportes', 'universo', 'unimás', 'unimas', 'español', 'espanol', 'latino']

export function languageOf(channel: string): TvListing['language'] {
  const c = channel.toLowerCase()
  if (SPANISH.some((w) => c.includes(w))) return 'es'
  return 'en'
}

export function isUnitedStates(country?: string | null): boolean {
  const c = (country ?? '').trim().toLowerCase()
  return c === 'united states' || c === 'usa' || c === 'us' || c === 'united states of america'
}

export function mapTv(raw: RawTv[]): TvListing[] {
  return raw
    .filter((r) => isUnitedStates(r.strCountry) && r.strChannel)
    .map<TvListing>((r) => ({
      country: 'United States',
      channel: (r.strChannel ?? '').trim(),
      time: r.strTime ?? undefined,
      logoUrl: r.strLogo ?? undefined,
      language: languageOf(r.strChannel ?? ''),
    }))
    .filter((l, i, all) => all.findIndex((x) => x.channel.toLowerCase() === l.channel.toLowerCase()) === i)
}

/** U.S. broadcast listings the feed has for this game. Often thin — a supplement to the rights map, not a replacement. */
export async function fetchTvListings(fixture: Fixture): Promise<TvListings | null> {
  const key = `sfp.tv.${fixture.id}`
  const cached = readJson<TvListings | null>(key, null)
  if (cached && (fixture.status === 'final' || fresh(cached.fetchedAt, TV_TTL_MS))) return cached
  const data = await getJson<{ tvevent: RawTv[] | null }>(`${BASE}/lookuptv.php?id=${fixture.id}`)
  const result: TvListings = { us: mapTv(data.tvevent ?? []), fetchedAt: new Date().toISOString() }
  writeJson(key, result)
  return result
}

/* ---------- Highlights ---------- */

export interface Highlight {
  url: string
  fetchedAt: string
}

interface RawHighlight {
  strVideo?: string | null
}

/** Official highlight link for a finished game (premium). Null when the feed has none. */
export async function fetchHighlight(fixture: Fixture): Promise<Highlight | null> {
  const key = `sfp.highlight.${fixture.id}`
  const cached = readJson<Highlight | null>(key, null)
  if (cached) return cached
  const data = await getJson<{ lookup: RawHighlight[] | null }>(`${V2}/lookup/event_highlights/${fixture.id}`)
  const url = (data.lookup ?? [])[0]?.strVideo ?? null
  if (!url || !/^https:\/\/(www\.)?youtu(\.be|be\.com)\//.test(url)) return null
  const result: Highlight = { url, fetchedAt: new Date().toISOString() }
  writeJson(key, result)
  return result
}
