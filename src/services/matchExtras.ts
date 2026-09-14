import { getLeague } from '../data/leagues'
import type { Fixture, LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { getTeam } from '../data/teams'
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

  const data = await getJson<{ lineup: RawLineup[] | null }>(`${BASE}/lookuplineup?id=${fixture.id}`)
  const raw = data.lineup ?? []
  if (raw.length === 0) return cached
  const grouped = groupLineup(raw)
  const result: MatchLineup = { ...grouped, fetchedAt: new Date().toISOString() }
  writeJson(key, result)
  return result
}

export async function fetchTable(fixture: Fixture): Promise<LeagueTable | null> {
  const league = getLeague(fixture.leagueId)
  if (!league.sportsDbId) return null
  const season = fixture.season ?? seasonFor(fixture.leagueId, fixture.kickoffUtc)
  const key = `sfp.table.${fixture.leagueId}.${season}`
  const cached = readJson<LeagueTable | null>(key, null)
  if (cached && fresh(cached.fetchedAt, TABLE_TTL_MS)) return cached

  const data = await getJson<{ table: RawTableRow[] | null }>(
    `${BASE}/lookuptable?l=${league.sportsDbId}&s=${encodeURIComponent(season)}`,
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
  const data = await getJson<{ tvevent: RawTv[] | null }>(`${BASE}/lookuptv?id=${fixture.id}`)
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

/* ---------- Match events (timeline) and stats ---------- */

export type EventKind = 'goal' | 'own-goal' | 'penalty' | 'missed-penalty' | 'yellow' | 'red' | 'sub' | 'var' | 'other'

export interface MatchEvent {
  minute: number
  side: 'home' | 'away'
  kind: EventKind
  player: string
  detail?: string
}

export interface MatchStat {
  label: string
  home: number
  away: number
  percent?: boolean
}

export interface MatchReport {
  events: MatchEvent[]
  stats: MatchStat[]
  fetchedAt: string
}

interface RawTimeline {
  intTime?: string | null
  strTimeline?: string | null
  strTimelineDetail?: string | null
  strPlayer?: string | null
  strAssist?: string | null
  strHome?: string | null
  strTeam?: string | null
  strComment?: string | null
}

interface RawStat {
  strStat?: string | null
  intHome?: string | null
  intAway?: string | null
}

const LIVE_REPORT_TTL_MS = 90 * 1000
const FINAL_REPORT_TTL_MS = 24 * 60 * 60 * 1000

function kindOf(t: RawTimeline): EventKind {
  const type = (t.strTimeline ?? '').toLowerCase()
  const detail = (t.strTimelineDetail ?? '').toLowerCase()
  if (type === 'goal') {
    if (detail.includes('missed')) return 'missed-penalty'
    if (detail.includes('own')) return 'own-goal'
    if (detail.includes('penalty')) return 'penalty'
    return 'goal'
  }
  if (type === 'card') return detail.includes('red') ? 'red' : 'yellow'
  if (type.startsWith('subst')) return 'sub'
  if (type === 'var') return 'var'
  return 'other'
}

/** Which side an event belongs to: the team name is more reliable than the feed's home flag. */
function sideOf(t: RawTimeline, homeName: string, awayName: string): 'home' | 'away' {
  const team = (t.strTeam ?? '').trim().toLowerCase()
  if (team && team === homeName.toLowerCase()) return 'home'
  if (team && team === awayName.toLowerCase()) return 'away'
  return (t.strHome ?? '').toLowerCase() === 'yes' ? 'home' : 'away'
}

export function mapTimeline(raw: RawTimeline[], homeName: string, awayName: string): MatchEvent[] {
  return raw
    .filter((t) => t.strPlayer && t.intTime)
    .map<MatchEvent>((t) => {
      const kind = kindOf(t)
      const assist = (t.strAssist ?? '').trim()
      const comment = (t.strComment ?? '').trim()
      let detail: string | undefined
      if (kind === 'sub') detail = assist ? `for ${assist}` : undefined
      else if (kind === 'goal' || kind === 'penalty') detail = assist ? `assist ${assist}` : t.strTimelineDetail?.includes('Penalty') ? 'penalty' : undefined
      else if (kind === 'yellow' || kind === 'red') detail = comment && comment !== 'NULL' ? comment : undefined
      else if (kind === 'missed-penalty') detail = 'penalty missed'
      else if (kind === 'own-goal') detail = 'own goal'
      return { minute: Number(t.intTime), side: sideOf(t, homeName, awayName), kind, player: (t.strPlayer ?? '').trim(), detail }
    })
    .sort((a, b) => a.minute - b.minute)
}

const STAT_ORDER = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Shots off Goal', 'Blocked Shots', 'Corner Kicks', 'Fouls', 'Offsides', 'Yellow Cards', 'Red Cards', 'Goalkeeper Saves', 'Total passes', 'Passes accurate', 'Passes %']

export function mapStats(raw: RawStat[]): MatchStat[] {
  const rows = raw
    .filter((r) => r.strStat)
    .map<MatchStat>((r) => {
      const label = (r.strStat ?? '').trim()
      const parse = (v?: string | null) => Number(String(v ?? '0').replace('%', '')) || 0
      return { label, home: parse(r.intHome), away: parse(r.intAway), percent: label.toLowerCase().includes('possession') || label.includes('%') }
    })
  return rows.sort((a, b) => {
    const ia = STAT_ORDER.indexOf(a.label)
    const ib = STAT_ORDER.indexOf(b.label)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

/** Goals, cards, subs and the stat sheet for one game. Live games refresh every ~90s; finished ones are kept. */
export async function fetchMatchReport(fixture: Fixture): Promise<MatchReport | null> {
  const key = `sfp.report.${fixture.id}`
  const cached = readJson<MatchReport | null>(key, null)
  const ttl = fixture.status === 'final' ? FINAL_REPORT_TTL_MS : LIVE_REPORT_TTL_MS
  if (cached && fresh(cached.fetchedAt, ttl)) return cached
  const home = getTeam(fixture.homeTeamId)?.name ?? ''
  const away = getTeam(fixture.awayTeamId)?.name ?? ''
  const [timeline, stats] = await Promise.all([
    getJson<{ timeline: RawTimeline[] | null }>(`${BASE}/lookuptimeline?id=${fixture.id}`),
    getJson<{ eventstats: RawStat[] | null }>(`${BASE}/lookupeventstats?id=${fixture.id}`),
  ])
  const report: MatchReport = {
    events: mapTimeline(timeline.timeline ?? [], home, away),
    stats: mapStats(stats.eventstats ?? []),
    fetchedAt: new Date().toISOString(),
  }
  writeJson(key, report)
  return report
}
