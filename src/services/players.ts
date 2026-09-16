/** Players: search, squads, season statistics and injuries from API-Football. */
import { readJson, writeJson } from '../lib/storage'
import { AF, getJson, PLAYER_PHOTO, seasonGuess } from './apiFootball'

export const MAX_PLAYERS = 10

export interface FollowedPlayer {
  id: string
  name: string
  fullName?: string
  position?: string
  number?: number | null
  nationality?: string
  age?: number | null
  photo?: string
  teamProviderId?: string
  teamName?: string
  teamLogo?: string
}

export interface PlayerCompetitionStats {
  team: string
  teamProviderId: string
  teamLogo?: string
  league: string
  leagueLogo?: string
  apps: number
  minutes: number
  rating: number | null
  goals: number
  assists: number
  shots: number
  shotsOn: number
  keyPasses: number
  dribbles: number
  yellow: number
  red: number
  isNationalTeam: boolean
}

export interface PlayerSeason {
  player: FollowedPlayer & { injured?: boolean; height?: string; birthDate?: string }
  season: number
  rows: PlayerCompetitionStats[]
  fetchedAt: string
}

export interface PlayerInjury {
  type: string
  reason: string
  date: string
}

interface RawProfile {
  player: {
    id: number
    name: string
    firstname?: string | null
    lastname?: string | null
    age?: number | null
    nationality?: string | null
    position?: string | null
    number?: number | null
    photo?: string | null
    height?: string | null
    birth?: { date?: string | null }
    injured?: boolean
  }
}

interface RawStatBlock {
  team: { id: number; name: string; logo?: string | null }
  league: { id: number | null; name: string | null; logo?: string | null; season?: number | null }
  games: { appearences: number | null; minutes: number | null; rating: string | null; position?: string | null }
  shots: { total: number | null; on: number | null }
  goals: { total: number | null; assists: number | null }
  passes: { key: number | null }
  dribbles: { success: number | null }
  cards: { yellow: number | null; red: number | null }
}

interface RawPlayerStats extends RawProfile {
  statistics: RawStatBlock[]
}

const STATS_TTL_MS = 6 * 60 * 60 * 1000
const INJURY_TTL_MS = 60 * 60 * 1000

function profileToPlayer(raw: RawProfile['player']): FollowedPlayer {
  const full = [raw.firstname, raw.lastname].filter(Boolean).join(' ').trim()
  return {
    id: String(raw.id),
    name: raw.name,
    fullName: full || undefined,
    position: raw.position ?? undefined,
    number: raw.number ?? null,
    nationality: raw.nationality ?? undefined,
    age: raw.age ?? null,
    photo: raw.photo ?? PLAYER_PHOTO(raw.id),
  }
}

/** Search players by name (the provider needs at least four letters). */
export async function searchPlayers(query: string): Promise<FollowedPlayer[]> {
  const q = query.trim()
  if (q.length < 4) return []
  const rows = await getJson<RawProfile[]>(`${AF}/players/profiles?search=${encodeURIComponent(q)}`)
  return rows.slice(0, 25).map((r) => profileToPlayer(r.player))
}

/** A club's current squad. */
export async function fetchSquad(teamProviderId: string): Promise<FollowedPlayer[]> {
  const key = `sfp.squad.${teamProviderId}`
  const cached = readJson<{ players: FollowedPlayer[]; fetchedAt: string } | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < 24 * 60 * 60 * 1000) return cached.players
  const rows = await getJson<{ team: { id: number; name: string; logo?: string }; players: { id: number; name: string; age: number | null; number: number | null; position: string | null; photo: string | null }[] }[]>(
    `${AF}/players/squads?team=${teamProviderId}`,
  )
  const squad = rows[0]
  const players = (squad?.players ?? []).map<FollowedPlayer>((p) => ({
    id: String(p.id),
    name: p.name,
    position: p.position ?? undefined,
    number: p.number,
    age: p.age,
    photo: p.photo ?? PLAYER_PHOTO(p.id),
    teamProviderId: String(squad.team.id),
    teamName: squad.team.name,
    teamLogo: squad.team.logo,
  }))
  writeJson(key, { players, fetchedAt: new Date().toISOString() })
  return players
}

const NATIONAL_HINT = /^(England|Spain|Italy|Germany|France|Netherlands|Portugal|Brazil|Argentina|USA|Mexico|Belgium|Croatia|Uruguay|Colombia|Japan|Korea Republic|Morocco|Senegal|Nigeria|Ghana|Norway|Sweden|Denmark|Switzerland|Austria|Poland|Scotland|Wales|Ireland|Turkey|Türkiye|Serbia|Ukraine|Canada|Australia|Egypt|Saudi Arabia|Ecuador|Chile|Peru|Paraguay)$/

export function mapPlayerSeason(raw: RawPlayerStats, season: number): PlayerSeason {
  const player = { ...profileToPlayer(raw.player), injured: raw.player.injured, height: raw.player.height ?? undefined, birthDate: raw.player.birth?.date ?? undefined }
  const rows = raw.statistics
    .filter((s) => (s.games.appearences ?? 0) > 0 || (s.games.minutes ?? 0) > 0)
    .map<PlayerCompetitionStats>((s) => ({
      team: s.team.name,
      teamProviderId: String(s.team.id),
      teamLogo: s.team.logo ?? undefined,
      league: s.league.name ?? 'Other',
      leagueLogo: s.league.logo ?? undefined,
      apps: s.games.appearences ?? 0,
      minutes: s.games.minutes ?? 0,
      rating: s.games.rating ? Number(Number(s.games.rating).toFixed(2)) : null,
      goals: s.goals.total ?? 0,
      assists: s.goals.assists ?? 0,
      shots: s.shots.total ?? 0,
      shotsOn: s.shots.on ?? 0,
      keyPasses: s.passes.key ?? 0,
      dribbles: s.dribbles.success ?? 0,
      yellow: s.cards.yellow ?? 0,
      red: s.cards.red ?? 0,
      isNationalTeam: NATIONAL_HINT.test(s.team.name),
    }))
    .sort((a, b) => b.minutes - a.minutes)
  // The club a player currently plays for: the club (not national) row with the most minutes.
  const club = rows.find((r) => !r.isNationalTeam) ?? rows[0]
  if (club) {
    player.teamProviderId = club.teamProviderId
    player.teamName = club.team
    player.teamLogo = club.teamLogo
  }
  if (!player.position) {
    const pos = raw.statistics.find((s) => s.games.position)?.games.position
    if (pos) player.position = pos
  }
  return { player, season, rows, fetchedAt: new Date().toISOString() }
}

export function totals(rows: PlayerCompetitionStats[], clubOnly = false): { apps: number; goals: number; assists: number; minutes: number; rating: number | null } {
  const use = clubOnly ? rows.filter((r) => !r.isNationalTeam) : rows
  const apps = use.reduce((n, r) => n + r.apps, 0)
  const goals = use.reduce((n, r) => n + r.goals, 0)
  const assists = use.reduce((n, r) => n + r.assists, 0)
  const minutes = use.reduce((n, r) => n + r.minutes, 0)
  const rated = use.filter((r) => r.rating !== null && r.apps > 0)
  const rating = rated.length ? Number((rated.reduce((n, r) => n + (r.rating ?? 0) * r.apps, 0) / rated.reduce((n, r) => n + r.apps, 0)).toFixed(2)) : null
  return { apps, goals, assists, minutes, rating }
}

/** Season statistics for a player across every competition. Cached six hours. */
export async function fetchPlayerSeason(playerId: string, season = seasonGuess()): Promise<PlayerSeason | null> {
  const key = `sfp.player.${playerId}.${season}`
  const cached = readJson<PlayerSeason | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < STATS_TTL_MS) return cached
  const rows = await getJson<RawPlayerStats[]>(`${AF}/players?id=${playerId}&season=${season}`)
  if (!rows[0]) return cached
  const out = mapPlayerSeason(rows[0], season)
  writeJson(key, out)
  return out
}

/** Current injuries/suspensions for a player this season. */
export async function fetchPlayerInjuries(playerId: string, season = seasonGuess()): Promise<PlayerInjury[]> {
  const key = `sfp.injury.${playerId}.${season}`
  const cached = readJson<{ items: PlayerInjury[]; fetchedAt: string } | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < INJURY_TTL_MS) return cached.items
  const rows = await getJson<{ player: { type: string; reason: string }; fixture: { date: string } }[]>(`${AF}/injuries?player=${playerId}&season=${season}`)
  const items = rows.map((r) => ({ type: r.player.type, reason: r.player.reason, date: r.fixture.date })).sort((a, b) => b.date.localeCompare(a.date))
  writeJson(key, { items, fetchedAt: new Date().toISOString() })
  return items
}
