import { getLeague } from '../data/leagues'
import { restoreLeagues } from '../data/leagues'
import { dynamicTeamId, registerTeams, restoreRegistry, teamBySportsDb } from '../data/teams'
import type { LeagueId, Team } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { getJson, V2 } from './theSportsDb'

const CATALOGUE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const CUSTOM_KEY = 'sfp.customTeams.v1'

interface RawTeam {
  idTeam?: string
  strTeam?: string
  strTeamShort?: string | null
  strBadge?: string | null
  strStadium?: string | null
  strCountry?: string | null
  strColour1?: string | null
  strColour2?: string | null
}

interface Catalogue {
  teams: Team[]
  fetchedAt: string
}

/** Leagues whose clubs can be browsed. Cups and continental competitions draw from these. */
export const BROWSABLE_LEAGUES: LeagueId[] = ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'mls', 'eredivisie', 'primeira']

function shortNameFor(raw: RawTeam): string {
  const given = (raw.strTeamShort ?? '').trim().toUpperCase()
  if (given) return given.slice(0, 4)
  const name = (raw.strTeam ?? '').replace(/[^A-Za-z ]/g, '')
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 3) || '???'
}

function hexOr(value: string | null | undefined, fallback: string): string {
  const v = (value ?? '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback
}

/** A club record from any feed object that carries idTeam/strTeam (league lists and events alike). */
export function teamFromFeed(raw: RawTeam, leagueId: LeagueId): Team | null {
  return mapClub(raw, leagueId)
}

export function mapClub(raw: RawTeam, leagueId: LeagueId): Team | null {
  if (!raw.idTeam || !raw.strTeam) return null
  const existing = teamBySportsDb(raw.idTeam)
  return {
    id: existing?.id ?? dynamicTeamId(raw.idTeam),
    name: raw.strTeam,
    shortName: shortNameFor(raw),
    leagueId,
    country: raw.strCountry ?? '',
    stadium: raw.strStadium ?? '',
    badgeUrl: raw.strBadge ?? '',
    sportsDbId: raw.idTeam,
    color: hexOr(raw.strColour1, '#17643F'),
    colorSecondary: hexOr(raw.strColour2, '#FBF8F0'),
    followable: true,
  }
}

/** Every club in a league, from the device cache when fresh, otherwise the feed (premium). */
export async function loadLeagueClubs(leagueId: LeagueId): Promise<Team[]> {
  const league = getLeague(leagueId)
  if (!league.sportsDbId) return []
  const key = `sfp.clubs.${leagueId}.v1`
  const cached = readJson<Catalogue | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CATALOGUE_TTL_MS) {
    registerTeams(cached.teams)
    return cached.teams
  }
  const data = await getJson<{ list: RawTeam[] | null }>(`${V2}/list/teams/${league.sportsDbId}`)
  const teams = (data.list ?? []).map((r) => mapClub(r, leagueId)).filter((t): t is Team => t !== null)
  if (teams.length === 0) return cached?.teams ?? []
  registerTeams(teams)
  writeJson<Catalogue>(key, { teams, fetchedAt: new Date().toISOString() })
  return teams
}

/** Clubs the user follows that only exist in the feed — kept on device so fixtures map before any catalogue loads. */
export function readCustomTeams(): Team[] {
  return readJson<Team[]>(CUSTOM_KEY, [])
}

export function rememberCustomTeams(follows: string[]): void {
  const custom = follows
    .map((id) => teamBySportsDb(id.startsWith('t') ? id.slice(1) : '') ?? undefined)
    .filter((t): t is Team => Boolean(t) && t!.id.startsWith('t'))
  writeJson(CUSTOM_KEY, custom)
}

/** Call once on boot: restore every feed club this phone has seen, so cached fixtures render with names. */
export function bootTeams(): void {
  registerTeams(readCustomTeams())
  restoreRegistry()
  restoreLeagues()
}
