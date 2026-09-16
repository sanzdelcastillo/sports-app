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
  /** The source only records assists for recent seasons; false means "unknown", not zero. */
  assistsKnown: boolean
  penScored: number
  penMissed: number
  /** Goalkeepers */
  conceded: number
  saves: number
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
  goals: { total: number | null; assists: number | null; conceded?: number | null; saves?: number | null }
  passes: { key: number | null }
  dribbles: { success: number | null }
  cards: { yellow: number | null; red: number | null }
  penalty?: { scored: number | null; missed: number | null }
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
      assistsKnown: s.goals.assists !== null && s.goals.assists !== undefined,
      penScored: s.penalty?.scored ?? 0,
      penMissed: s.penalty?.missed ?? 0,
      conceded: s.goals.conceded ?? 0,
      saves: s.goals.saves ?? 0,
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
  const ttl = season < seasonGuess() ? 30 * 24 * 60 * 60 * 1000 : STATS_TTL_MS
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < ttl) return cached
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

/* ---------- career ---------- */

export interface CareerClub {
  team: string
  teamProviderId: string
  logo?: string
  seasons: number[]
}

export interface Trophy {
  competition: string
  country: string
  season: string
  place: string
}

export interface Career {
  clubs: CareerClub[]
  seasons: number[]
  trophies: Trophy[]
  fetchedAt: string
}

const CAREER_TTL_MS = 24 * 60 * 60 * 1000

/** Clubs and national teams by season, the seasons with data, and honours. Cached a day. */
export async function fetchCareer(playerId: string): Promise<Career> {
  const key = `sfp.career.${playerId}`
  const cached = readJson<Career | null>(key, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CAREER_TTL_MS) return cached
  const [teams, seasons, trophies] = await Promise.all([
    getJson<{ team: { id: number; name: string; logo?: string | null }; seasons: number[] }[]>(`${AF}/players/teams?player=${playerId}`),
    getJson<number[]>(`${AF}/players/seasons?player=${playerId}`),
    getJson<{ league: string | null; country: string | null; season: string | null; place: string | null }[]>(`${AF}/trophies?player=${playerId}`).catch(() => []),
  ])
  const career: Career = {
    clubs: teams
      .filter((t) => t.seasons.length > 0)
      .map((t) => ({ team: t.team.name, teamProviderId: String(t.team.id), logo: t.team.logo ?? undefined, seasons: [...t.seasons].sort((a, b) => b - a) }))
      .sort((a, b) => b.seasons[0] - a.seasons[0]),
    seasons: [...seasons].sort((a, b) => b - a),
    trophies: trophies
      .filter((t) => /winner/i.test(t.place ?? ''))
      // Pre-season silverware isn't an honour anyone brags about.
      .filter((t) => !/emirates cup|florida cup|all-star|friendl|audi cup|champions cup international|international champions cup|premier league asia|joan gamper|gamper|super match|pre-season|preseason|summer series|dubai|marbella|eusébio|eusebio cup|teresa herrera|ramón de carranza|carranza|colombino|trofeo|trophy of|amsterdam tournament|invitational|uhrencup|telekom cup|mls all/i.test(t.league ?? ''))
      .map((t) => ({ competition: t.league ?? 'Trophy', country: t.country ?? '', season: String(t.season ?? ''), place: t.place ?? 'Winner' }))
      .sort((a, b) => b.season.localeCompare(a.season)),
    fetchedAt: new Date().toISOString(),
  }
  writeJson(key, career)
  return career
}

/* ---------- career totals ---------- */

export interface CareerSide {
  apps: number
  goals: number
  assists: number
  minutes: number
  yellow: number
  red: number
  penScored: number
  penMissed: number
  conceded: number
  saves: number
}

export interface CareerTotals {
  club: CareerSide
  country: CareerSide
  /** First season the source has any games for. */
  since: number | null
  /** First season with assists recorded — totals before this are unknown, not zero. */
  assistsSince: number | null
  seasonsCounted: number
  fetchedAt: string
}

const CAREER_TOTALS_TTL_MS = 24 * 60 * 60 * 1000
const FRIENDLY = /friendl|emirates cup|florida cup|pre-season|preseason|summer series|all-star|audi cup|international champions cup|premier league asia|joan gamper|gamper|super match|dubai|trofeo|uhrencup|telekom cup|invitational|mls all/i

function emptySide(): CareerSide {
  return { apps: 0, goals: 0, assists: 0, minutes: 0, yellow: 0, red: 0, penScored: 0, penMissed: 0, conceded: 0, saves: 0 }
}

function addRow(side: CareerSide, r: PlayerCompetitionStats): void {
  side.apps += r.apps
  side.goals += r.goals
  side.assists += r.assistsKnown ? r.assists : 0
  side.minutes += r.minutes
  side.yellow += r.yellow
  side.red += r.red
  side.penScored += r.penScored
  side.penMissed += r.penMissed
  side.conceded += r.conceded
  side.saves += r.saves
}

export function sumCareer(seasons: PlayerSeason[]): Omit<CareerTotals, 'fetchedAt'> {
  const club = emptySide()
  const country = emptySide()
  let since: number | null = null
  let assistsSince: number | null = null
  for (const s of seasons) {
    if (s.rows.length === 0) continue
    // Club friendlies don't count as career games; international friendlies are caps.
    const counted = s.rows.filter((r) => r.isNationalTeam || !FRIENDLY.test(r.league))
    if (counted.length === 0) continue
    since = since === null ? s.season : Math.min(since, s.season)
    if (counted.some((r) => r.assistsKnown)) assistsSince = assistsSince === null ? s.season : Math.min(assistsSince, s.season)
    for (const r of counted) addRow(r.isNationalTeam ? country : club, r)
  }
  return { club, country, since, assistsSince, seasonsCounted: seasons.filter((s) => s.rows.length > 0).length }
}

/** Every season the source has, added up. One request per season the first time; cached a day. */
export async function fetchCareerTotals(playerId: string, seasons: number[]): Promise<CareerTotals> {
  const key = `sfp.careerTotals.${playerId}`
  const cached = readJson<CareerTotals | null>(key, null)
  if (cached && cached.seasonsCounted > 0 && Date.now() - new Date(cached.fetchedAt).getTime() < CAREER_TOTALS_TTL_MS) return cached
  const all = await Promise.all(seasons.map((y) => fetchPlayerSeason(playerId, y).catch(() => null)))
  const totalsOut: CareerTotals = { ...sumCareer(all.filter((s): s is PlayerSeason => s !== null)), fetchedAt: new Date().toISOString() }
  writeJson(key, totalsOut)
  return totalsOut
}
