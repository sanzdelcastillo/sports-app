/**
 * Per-game detail from API-Football: lineups (with pitch positions), standings, events and stats.
 * Cached on device; live games refresh on a short cycle.
 */
import { getLeague } from '../data/leagues'
import { getTeam } from '../data/teams'
import type { Fixture, LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { AF, getJson, PLAYER_PHOTO, seasonGuess, teamFromProvider } from './apiFootball'

/* ---------- lineups ---------- */

export type LineupSlot = 'GK' | 'DEF' | 'MID' | 'FWD' | 'SUB'

export interface LineupPlayer {
  id: string
  name: string
  number: number | null
  slot: LineupSlot
  /** Pitch grid from the source: row 1 is the goalkeeper line, columns run left to right. */
  row?: number
  col?: number
  cutoutUrl?: string
}

export interface TeamLineup {
  starters: LineupPlayer[]
  bench: LineupPlayer[]
  /** Formation as published, e.g. "4-2-3-1". */
  shape: string | null
  coach?: string
}

export interface MatchLineup {
  home: TeamLineup
  away: TeamLineup
  fetchedAt: string
}

interface RawLineupPlayer {
  player: { id: number; name: string; number: number | null; pos: string | null; grid: string | null }
}

interface RawLineup {
  team: { id: number; name: string }
  coach?: { id: number | null; name: string | null }
  formation: string | null
  startXI: RawLineupPlayer[]
  substitutes: RawLineupPlayer[]
}

const LINEUP_TTL_MS = 10 * 60 * 1000
const LINEUP_PREMATCH_TTL_MS = 3 * 60 * 1000

function slotFor(pos: string | null | undefined): LineupSlot {
  const p = (pos ?? '').toUpperCase()
  if (p === 'G') return 'GK'
  if (p === 'D') return 'DEF'
  if (p === 'M') return 'MID'
  if (p === 'F') return 'FWD'
  return 'SUB'
}

const SLOT_ORDER: Record<LineupSlot, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3, SUB: 4 }

function player(raw: RawLineupPlayer, bench: boolean): LineupPlayer {
  const [row, col] = (raw.player.grid ?? '').split(':').map((n) => Number(n))
  return {
    id: String(raw.player.id),
    name: raw.player.name,
    number: raw.player.number,
    slot: bench ? 'SUB' : slotFor(raw.player.pos),
    row: Number.isFinite(row) && row > 0 ? row : undefined,
    col: Number.isFinite(col) && col > 0 ? col : undefined,
    cutoutUrl: raw.player.id ? PLAYER_PHOTO(raw.player.id) : undefined,
  }
}

export function mapLineups(raw: RawLineup[], homeProviderId: string): { home: TeamLineup; away: TeamLineup } {
  const side = (isHome: boolean): TeamLineup => {
    const entry = raw.find((r) => (String(r.team.id) === homeProviderId) === isHome)
    if (!entry) return { starters: [], bench: [], shape: null }
    const starters = entry.startXI.map((p) => player(p, false)).sort((a, b) => SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot] || (a.row ?? 0) - (b.row ?? 0) || (a.col ?? 0) - (b.col ?? 0))
    const bench = entry.substitutes.map((p) => player(p, true))
    return { starters, bench, shape: entry.formation, coach: entry.coach?.name ?? undefined }
  }
  return { home: side(true), away: side(false) }
}

/** Shape by counting rows, for a lineup that arrived without a formation string. */
export function shapeOf(starters: LineupPlayer[]): string | null {
  const rows = new Map<number, number>()
  for (const p of starters) if (p.row && p.row > 1) rows.set(p.row, (rows.get(p.row) ?? 0) + 1)
  if (rows.size === 0) return null
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n).join('-')
}

function fresh(fetchedAt: string, ttl: number): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < ttl
}

export async function fetchLineup(fixture: Fixture): Promise<MatchLineup | null> {
  const key = `sfp.lineup.${fixture.id}`
  const cached = readJson<MatchLineup | null>(key, null)
  const ttl = fixture.status === 'final' ? 7 * 24 * 60 * 60 * 1000 : fixture.status === 'live' ? LINEUP_TTL_MS : LINEUP_PREMATCH_TTL_MS
  if (cached && (cached.home.starters.length > 0 || fixture.status === 'final') && fresh(cached.fetchedAt, ttl)) return cached
  const home = getTeam(fixture.homeTeamId)
  const raw = await getJson<RawLineup[]>(`${AF}/fixtures/lineups?fixture=${fixture.id}`)
  const mapped = mapLineups(raw, home?.providerId ?? '')
  const lineup: MatchLineup = { ...mapped, fetchedAt: new Date().toISOString() }
  writeJson(key, lineup)
  return lineup
}

/* ---------- standings ---------- */

export interface StandingRow {
  teamProviderId: string
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
  group?: string
}

export interface LeagueTable {
  leagueId: LeagueId
  season: string
  rows: StandingRow[]
  fetchedAt: string
}

interface RawStandingRow {
  rank: number
  team: { id: number; name: string; logo: string | null }
  points: number
  goalsDiff: number
  group?: string | null
  form?: string | null
  description?: string | null
  all: { played: number; win: number; draw: number; lose: number }
}

interface RawStandings {
  league: { id: number; season: number; standings: RawStandingRow[][] }
}

const TABLE_TTL_MS = 60 * 60 * 1000

export function mapStandings(raw: RawStandings[]): StandingRow[] {
  const groups = raw[0]?.league.standings ?? []
  return groups.flatMap((rows) =>
    rows.map<StandingRow>((r) => ({
      teamProviderId: String(r.team.id),
      team: r.team.name,
      rank: r.rank,
      played: r.all.played,
      won: r.all.win,
      drawn: r.all.draw,
      lost: r.all.lose,
      goalDiff: r.goalsDiff,
      points: r.points,
      form: (r.form ?? '').replace(/[^WDL]/g, ''),
      note: r.description ?? undefined,
      badgeUrl: r.team.logo ?? undefined,
      group: rows.length < 12 && r.group ? r.group : undefined,
    })),
  )
}

export function seasonFor(leagueId: LeagueId, kickoffUtc: string): string {
  const league = getLeague(leagueId)
  return String(league.currentSeason ?? seasonGuess(new Date(kickoffUtc)))
}

/** Standings for a competition. Empty rows mean the source has no table (knockout cups, or none yet). */
export async function fetchStandings(leagueId: LeagueId, season?: string): Promise<LeagueTable | null> {
  const league = getLeague(leagueId)
  if (!league.providerId) return null
  const s = season ?? String(league.currentSeason ?? seasonGuess())
  const key = `sfp.table.${leagueId}.${s}`
  const cached = readJson<LeagueTable | null>(key, null)
  if (cached && fresh(cached.fetchedAt, TABLE_TTL_MS)) return cached
  const raw = await getJson<RawStandings[]>(`${AF}/standings?league=${league.providerId}&season=${s}`)
  const rows = mapStandings(raw)
  for (const row of rows) teamFromProvider({ id: Number(row.teamProviderId), name: row.team, logo: row.badgeUrl }, leagueId)
  const table: LeagueTable = { leagueId, season: s, rows, fetchedAt: new Date().toISOString() }
  writeJson(key, table)
  return table
}

export async function fetchTable(fixture: Fixture): Promise<LeagueTable | null> {
  return fetchStandings(fixture.leagueId, fixture.season ?? seasonFor(fixture.leagueId, fixture.kickoffUtc))
}

/* ---------- highlights ---------- */

export interface Highlight {
  url: string
}

/** A search link is honest and always works; no provider gives us licensed highlight clips. */
export function highlightSearch(fixture: Fixture): Highlight {
  const home = getTeam(fixture.homeTeamId)?.name ?? ''
  const away = getTeam(fixture.awayTeamId)?.name ?? ''
  const q = `${home} vs ${away} highlights ${fixture.kickoffUtc.slice(0, 10)}`
  return { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` }
}

/* ---------- match events and stats ---------- */

export type EventKind = 'goal' | 'own-goal' | 'penalty' | 'missed-penalty' | 'yellow' | 'red' | 'sub' | 'var' | 'other'

export interface MatchEvent {
  minute: number
  extra?: number
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

interface RawEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
  comments?: string | null
}

interface RawStatBlock {
  team: { id: number; name: string }
  statistics: { type: string; value: number | string | null }[]
}

const LIVE_REPORT_TTL_MS = 90 * 1000
const FINAL_REPORT_TTL_MS = 24 * 60 * 60 * 1000

function kindOf(e: RawEvent): EventKind {
  const type = e.type.toLowerCase()
  const detail = e.detail.toLowerCase()
  if (type === 'goal') {
    if (detail.includes('missed')) return 'missed-penalty'
    if (detail.includes('own')) return 'own-goal'
    if (detail.includes('penalty')) return 'penalty'
    return 'goal'
  }
  if (type === 'card') return detail.includes('red') ? 'red' : 'yellow'
  if (type === 'subst') return 'sub'
  if (type === 'var') return 'var'
  return 'other'
}

export function mapEvents(raw: RawEvent[], homeProviderId: string): MatchEvent[] {
  return raw
    .filter((e) => e.player?.name || e.type.toLowerCase() === 'var')
    .map<MatchEvent>((e) => {
      const kind = kindOf(e)
      const assist = (e.assist?.name ?? '').trim()
      let detail: string | undefined
      if (kind === 'sub') detail = assist ? `for ${assist}` : undefined
      else if (kind === 'goal' || kind === 'penalty') detail = assist ? `assist ${assist}` : kind === 'penalty' ? 'penalty' : undefined
      else if (kind === 'yellow' || kind === 'red') detail = e.comments?.trim() || undefined
      else if (kind === 'missed-penalty') detail = 'penalty missed'
      else if (kind === 'own-goal') detail = 'own goal'
      else if (kind === 'var') detail = e.detail
      return {
        minute: e.time.elapsed,
        extra: e.time.extra ?? undefined,
        side: String(e.team.id) === homeProviderId ? 'home' : 'away',
        kind,
        player: e.player?.name?.trim() || 'VAR',
        detail,
      }
    })
    .sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0))
}

const STAT_ORDER = ['Ball Possession', 'expected_goals', 'Total Shots', 'Shots on Goal', 'Shots off Goal', 'Blocked Shots', 'Shots insidebox', 'Shots outsidebox', 'Corner Kicks', 'Fouls', 'Offsides', 'Yellow Cards', 'Red Cards', 'Goalkeeper Saves', 'Total passes', 'Passes accurate', 'Passes %']
const STAT_LABEL: Record<string, string> = { expected_goals: 'Expected goals (xG)', 'Passes %': 'Pass accuracy' }

export function mapStats(raw: RawStatBlock[], homeProviderId: string): MatchStat[] {
  const home = raw.find((b) => String(b.team.id) === homeProviderId) ?? raw[0]
  const away = raw.find((b) => b !== home)
  if (!home || !away) return []
  const val = (v: number | string | null) => (v === null ? 0 : Number(String(v).replace('%', '')) || 0)
  const rows = home.statistics
    .map<MatchStat | null>((s) => {
      const other = away.statistics.find((a) => a.type === s.type)
      if (!other) return null
      return { label: STAT_LABEL[s.type] ?? s.type, home: val(s.value), away: val(other.value), percent: s.type === 'Ball Possession' || s.type === 'Passes %' }
    })
    .filter((s): s is MatchStat => s !== null)
    .filter((s) => !(s.home === 0 && s.away === 0 && s.label.includes('xG')))
  return rows.sort((a, b) => {
    const ia = STAT_ORDER.findIndex((t) => (STAT_LABEL[t] ?? t) === a.label)
    const ib = STAT_ORDER.findIndex((t) => (STAT_LABEL[t] ?? t) === b.label)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

/** Goals, cards, subs and the stat sheet for one game. Live games refresh every ~90s; finished ones are kept. */
export async function fetchMatchReport(fixture: Fixture): Promise<MatchReport | null> {
  const key = `sfp.report.${fixture.id}`
  const cached = readJson<MatchReport | null>(key, null)
  const ttl = fixture.status === 'final' ? FINAL_REPORT_TTL_MS : LIVE_REPORT_TTL_MS
  if (cached && fresh(cached.fetchedAt, ttl)) return cached
  const homeId = getTeam(fixture.homeTeamId)?.providerId ?? ''
  const [events, stats] = await Promise.all([
    getJson<RawEvent[]>(`${AF}/fixtures/events?fixture=${fixture.id}`),
    getJson<RawStatBlock[]>(`${AF}/fixtures/statistics?fixture=${fixture.id}`),
  ])
  const report: MatchReport = { events: mapEvents(events, homeId), stats: mapStats(stats, homeId), fetchedAt: new Date().toISOString() }
  writeJson(key, report)
  return report
}
