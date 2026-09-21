import { getLeague, restoreLeagues } from '../data/leagues'
import { registerTeams, restoreRegistry, teamByProviderId } from '../data/teams'
import type { LeagueId, Team } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { fetchLeagueTeams, fetchNationalTeams, searchTeams as providerSearch } from './apiFootball'

const CATALOGUE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const CUSTOM_KEY = 'sfp.customTeams.v1'

interface Catalogue {
  teams: Team[]
  fetchedAt: string
}

/** Leagues whose clubs are one tap away. Anything else is reachable through All leagues. */
export const BROWSABLE_LEAGUES: LeagueId[] = ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'mls', 'eredivisie', 'primeira']

/** Every club in a league, from the device cache when fresh, otherwise the provider. */
export async function loadLeagueClubs(leagueId: LeagueId): Promise<Team[]> {
  const league = getLeague(leagueId)
  if (!league.providerId) return []
  const key = `sfp.clubs.${leagueId}.v2`
  const cached = readJson<Catalogue | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CATALOGUE_TTL_MS) {
    registerTeams(cached.teams)
    return cached.teams
  }
  const teams = await fetchLeagueTeams(league)
  if (teams.length === 0) return cached?.teams ?? []
  writeJson<Catalogue>(key, { teams, fetchedAt: new Date().toISOString() })
  return teams
}

/** National teams (about a hundred), from the device cache when fresh, otherwise the provider. */
export async function loadNationalTeams(): Promise<Team[]> {
  const key = 'sfp.clubs.national.v1'
  const cached = readJson<Catalogue | null>(key, null)
  if (cached && cached.teams.length && Date.now() - new Date(cached.fetchedAt).getTime() < CATALOGUE_TTL_MS) {
    registerTeams(cached.teams)
    return cached.teams
  }
  const teams = await fetchNationalTeams()
  if (teams.length === 0) return cached?.teams ?? []
  writeJson<Catalogue>(key, { teams, fetchedAt: new Date().toISOString() })
  return teams
}

/** Search clubs anywhere in the world by name (three letters minimum). */
export async function searchClubs(query: string): Promise<Team[]> {
  return providerSearch(query)
}

/** Clubs the user follows that only exist in the provider — kept on device so fixtures map before any catalogue loads. */
export function readCustomTeams(): Team[] {
  return readJson<Team[]>(CUSTOM_KEY, [])
}

export function rememberCustomTeams(follows: string[]): void {
  const custom = follows
    .map((id) => (id.startsWith('t') ? teamByProviderId(id.slice(1)) : undefined))
    .filter((t): t is Team => Boolean(t) && /^t\d+$/.test(t!.id))
  writeJson(CUSTOM_KEY, custom)
}

/** Call once on boot. */
export function bootTeams(): void {
  registerTeams(readCustomTeams())
  restoreRegistry()
  restoreLeagues()
}
