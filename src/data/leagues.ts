import type { KnownLeagueId, League, LeagueId } from '../domain/types'

export const LEAGUES: Record<KnownLeagueId, League> = {
  mls: {
    id: 'mls',
    name: 'Major League Soccer',
    shortName: 'MLS',
    accent: '#FF6A00',
    sportsDbId: '4346',
  },
  epl: {
    id: 'epl',
    name: 'Premier League',
    shortName: 'EPL',
    accent: '#3D195B',
    sportsDbId: '4328',
  },
  laliga: {
    id: 'laliga',
    name: 'La Liga',
    shortName: 'La Liga',
    accent: '#EE4749',
    sportsDbId: '4335',
  },
  seriea: {
    id: 'seriea',
    name: 'Serie A',
    shortName: 'Serie A',
    accent: '#024494',
    sportsDbId: '4332',
  },
  ligue1: {
    id: 'ligue1',
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    accent: '#12233F',
    sportsDbId: '4334',
  },
  ucl: {
    id: 'ucl',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    accent: '#1B2A6B',
    sportsDbId: '4480',
  },
  bundesliga: {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    accent: '#D20515',
    sportsDbId: '4331',
  },
  eredivisie: {
    id: 'eredivisie',
    name: 'Eredivisie',
    shortName: 'Eredivisie',
    accent: '#EE7812',
    sportsDbId: '4337',
  },
  primeira: {
    id: 'primeira',
    name: 'Primeira Liga',
    shortName: 'Liga Portugal',
    accent: '#006633',
    sportsDbId: '4344',
  },
  eflcup: { id: 'eflcup', name: 'EFL Cup', shortName: 'EFL Cup', accent: '#0A3D62', sportsDbId: '4570' },
  facup: { id: 'facup', name: 'FA Cup', shortName: 'FA Cup', accent: '#B4172D', sportsDbId: '4482' },
  communityshield: { id: 'communityshield', name: 'Community Shield', shortName: 'Comm. Shield', accent: '#B4172D', sportsDbId: '4571' },
  uel: { id: 'uel', name: 'UEFA Europa League', shortName: 'UEL', accent: '#F58220', sportsDbId: '4481' },
  uecl: { id: 'uecl', name: 'UEFA Conference League', shortName: 'UECL', accent: '#2F7D32', sportsDbId: '5071' },
  uefasupercup: { id: 'uefasupercup', name: 'UEFA Super Cup', shortName: 'Super Cup', accent: '#1B2A6B', sportsDbId: '4512' },
  copadelrey: { id: 'copadelrey', name: 'Copa del Rey', shortName: 'Copa del Rey', accent: '#C8102E', sportsDbId: '4483' },
  supercopa: { id: 'supercopa', name: 'Supercopa de España', shortName: 'Supercopa', accent: '#C8102E', sportsDbId: '4511' },
  coppaitalia: { id: 'coppaitalia', name: 'Coppa Italia', shortName: 'Coppa Italia', accent: '#024494', sportsDbId: '4506' },
  supercoppa: { id: 'supercoppa', name: 'Supercoppa Italiana', shortName: 'Supercoppa', accent: '#024494', sportsDbId: '4507' },
  dfbpokal: { id: 'dfbpokal', name: 'DFB-Pokal', shortName: 'DFB-Pokal', accent: '#000000', sportsDbId: '4485' },
  leaguescup: { id: 'leaguescup', name: 'Leagues Cup', shortName: 'Leagues Cup', accent: '#FF6A00', sportsDbId: '5281' },
  usopencup: { id: 'usopencup', name: 'U.S. Open Cup', shortName: 'Open Cup', accent: '#0B3D91', sportsDbId: '5199' },
  // More leagues with U.S. rights worth mapping by hand
  ligamx: { id: 'ligamx', name: 'Liga MX', shortName: 'Liga MX', accent: '#0B7A3B', sportsDbId: '4350' },
  brasileirao: { id: 'brasileirao', name: 'Brasileirão Série A', shortName: 'Brasileirão', accent: '#0A7C3E', sportsDbId: '4351' },
  spfl: { id: 'spfl', name: 'Scottish Premiership', shortName: 'SPFL', accent: '#1B3F8B', sportsDbId: '4330' },
  superlig: { id: 'superlig', name: 'Turkish Süper Lig', shortName: 'Süper Lig', accent: '#C8102E', sportsDbId: '4339' },
  argprimera: { id: 'argprimera', name: 'Argentine Primera División', shortName: 'Primera', accent: '#6CACE4', sportsDbId: '4406' },
  saudipro: { id: 'saudipro', name: 'Saudi Pro League', shortName: 'Saudi Pro', accent: '#1C7A3C', sportsDbId: '4668' },
  // National-team and continental tournaments
  worldcup: { id: 'worldcup', name: 'FIFA World Cup', shortName: 'World Cup', accent: '#1B2A6B', sportsDbId: '4429' },
  euros: { id: 'euros', name: 'UEFA European Championship', shortName: 'Euros', accent: '#0E4C92', sportsDbId: '4502' },
  copaamerica: { id: 'copaamerica', name: 'Copa América', shortName: 'Copa América', accent: '#C8102E', sportsDbId: '4499' },
  goldcup: { id: 'goldcup', name: 'CONCACAF Gold Cup', shortName: 'Gold Cup', accent: '#B8860B', sportsDbId: '4873' },
  uefanations: { id: 'uefanations', name: 'UEFA Nations League', shortName: 'Nations League', accent: '#0E4C92', sportsDbId: '4490' },
  concacafnations: { id: 'concacafnations', name: 'CONCACAF Nations League', shortName: 'CNL', accent: '#0B3D91', sportsDbId: '5280' },
  clubworldcup: { id: 'clubworldcup', name: 'FIFA Club World Cup', shortName: 'Club World Cup', accent: '#1B2A6B', sportsDbId: '4503' },
  libertadores: { id: 'libertadores', name: 'Copa Libertadores', shortName: 'Libertadores', accent: '#A6192E', sportsDbId: '4501' },
  concacafcc: { id: 'concacafcc', name: 'CONCACAF Champions Cup', shortName: 'CCC', accent: '#0B3D91', sportsDbId: '4721' },
  wcqconcacaf: { id: 'wcqconcacaf', name: 'World Cup Qualifying · CONCACAF', shortName: 'WCQ CONCACAF', accent: '#0B3D91', sportsDbId: '5516' },
  wcqconmebol: { id: 'wcqconmebol', name: 'World Cup Qualifying · CONMEBOL', shortName: 'WCQ CONMEBOL', accent: '#A6192E', sportsDbId: '5515' },
  wcquefa: { id: 'wcquefa', name: 'World Cup Qualifying · UEFA', shortName: 'WCQ UEFA', accent: '#0E4C92', sportsDbId: '5518' },
  other: {
    id: 'other',
    name: 'Soccer',
    shortName: 'Soccer',
    accent: '#007BFF',
  },
}

const SPORTSDB_LEAGUE: Record<string, LeagueId> = {
  '4346': 'mls',
  '4328': 'epl',
  '4335': 'laliga',
  '4332': 'seriea',
  '4334': 'ligue1',
  '4480': 'ucl',
  '4331': 'bundesliga',
  '4337': 'eredivisie',
  '4344': 'primeira',
  '4570': 'eflcup',
  '4482': 'facup',
  '4571': 'communityshield',
  '4481': 'uel',
  '5071': 'uecl',
  '4512': 'uefasupercup',
  '4483': 'copadelrey',
  '4511': 'supercopa',
  '4506': 'coppaitalia',
  '4507': 'supercoppa',
  '4485': 'dfbpokal',
  '5281': 'leaguescup',
  '5199': 'usopencup',
  '4429': 'worldcup',
  '4502': 'euros',
  '4499': 'copaamerica',
  '4873': 'goldcup',
  '4490': 'uefanations',
  '5280': 'concacafnations',
  '4503': 'clubworldcup',
  '4501': 'libertadores',
  '4721': 'concacafcc',
  '5516': 'wcqconcacaf',
  '5515': 'wcqconmebol',
  '5518': 'wcquefa',
  '4350': 'ligamx',
  '4351': 'brasileirao',
  '4330': 'spfl',
  '4339': 'superlig',
  '4406': 'argprimera',
  '4668': 'saudipro',
}

/* ---------- Dynamic league registry (feed leagues beyond the hand-mapped set) ---------- */

const REGISTRY_KEY = 'sfp.leagueRegistry.v1'
const dynamic = new Map<string, League>()
const dynamicBySportsDb = new Map<string, League>()
let leagueVersion = 0
let leaguesRestored = false

const ACCENTS = ['#0E3C29', '#1B2A6B', '#B64132', '#0B3D91', '#6B2D5C', '#8A5A00', '#2F6B4F', '#4A4A8A']

export function dynamicLeagueId(sportsDbId: string): string {
  return `l${sportsDbId}`
}

export function isDynamicLeagueId(id: string): boolean {
  return /^l\d+$/.test(id)
}

export function shortLeagueName(name: string): string {
  const cleaned = name
    .replace(/^(Argentinian|Argentine|Brazilian|Mexican|Scottish|Turkish|Danish|Dutch|Portuguese|Belgian|Swedish|Norwegian|Swiss|Austrian|Greek|Russian|Ukrainian|Polish|Czech|Croatian|Serbian|Japanese|Korean|Chinese|Australian|American|Canadian|Colombian|Chilean|Peruvian|Uruguayan|Ecuadorian|Paraguayan|Bolivian|Venezuelan|Egyptian|Moroccan|South African|Nigerian|Qatari|Saudi Arabian|Indian|Indonesian|Thai|Irish|Welsh|Northern Irish|English|Spanish|Italian|German|French)\s+/i, '')
    .trim()
  return cleaned.length > 16 ? cleaned.slice(0, 15).trim() + '…' : cleaned || name
}

export function registerLeagues(leagues: League[]): void {
  let changed = false
  for (const l of leagues) {
    if (!l.sportsDbId || SPORTSDB_LEAGUE[l.sportsDbId]) continue
    const existing = dynamicBySportsDb.get(l.sportsDbId)
    if (existing && existing.name === l.name) continue
    const merged: League = { ...existing, ...l, id: existing?.id ?? l.id }
    dynamic.set(merged.id, merged)
    dynamicBySportsDb.set(merged.sportsDbId!, merged)
    changed = true
  }
  if (changed) {
    leagueVersion += 1
    persistLeagues()
  }
}

function persistLeagues(): void {
  if (!leaguesRestored || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify([...dynamic.values()].slice(-800)))
  } catch {
    /* ignore */
  }
}

export function restoreLeagues(): void {
  if (leaguesRestored) return
  if (typeof localStorage === 'undefined') {
    leaguesRestored = true
    return
  }
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    const list = raw ? (JSON.parse(raw) as League[]) : []
    if (Array.isArray(list)) registerLeagues(list.filter((l) => l && typeof l.id === 'string' && l.sportsDbId))
  } catch {
    /* ignore */
  } finally {
    leaguesRestored = true
  }
}

export function leagueRegistryVersion(): number {
  return leagueVersion
}

/** A league from the feed, registered on sight so fixtures from any league render with a real name. */
export function leagueFromFeed(idLeague: string, name: string): League {
  const known = SPORTSDB_LEAGUE[idLeague]
  if (known) return LEAGUES[known as KnownLeagueId]
  const existing = dynamicBySportsDb.get(idLeague)
  if (existing) return existing
  const league: League = {
    id: dynamicLeagueId(idLeague),
    name,
    shortName: shortLeagueName(name),
    accent: ACCENTS[Number(idLeague) % ACCENTS.length],
    sportsDbId: idLeague,
  }
  registerLeagues([league])
  return league
}

/** Any league by app id — static, dynamic, or a safe placeholder. Never undefined. */
export function getLeague(id: LeagueId): League {
  const known = (LEAGUES as Record<string, League>)[id]
  if (known) return known
  const dyn = dynamic.get(id)
  if (dyn) return dyn
  return { id, name: 'Soccer', shortName: 'Soccer', accent: '#007BFF' }
}

export function allLeagues(): League[] {
  return [...Object.values(LEAGUES), ...dynamic.values()]
}

export function leagueFromSportsDb(idLeague?: string | null, name?: string | null): LeagueId {
  if (idLeague && SPORTSDB_LEAGUE[idLeague]) return SPORTSDB_LEAGUE[idLeague]
  const n = (name ?? '').toLowerCase()
  if (n.includes('champions league') && !n.includes('afc') && !n.includes('caf') && !n.includes('concacaf')) return 'ucl'
  if (n.includes('europa league')) return 'uel'
  if (n.includes('conference league')) return 'uecl'
  if (n.includes('efl cup') || n.includes('carabao') || n.includes('league cup')) return 'eflcup'
  if (n.includes('fa cup')) return 'facup'
  if (n.includes('copa del rey')) return 'copadelrey'
  if (n.includes('coppa italia')) return 'coppaitalia'
  if (n.includes('leagues cup')) return 'leaguescup'
  if (n.includes('club world cup')) return 'clubworldcup'
  if (n.includes('copa america') || n.includes('copa américa')) return 'copaamerica'
  if (n.includes('gold cup')) return 'goldcup'
  if (n.includes('libertadores')) return 'libertadores'
  if (idLeague && name) return leagueFromFeed(idLeague, name).id
  if (idLeague) {
    const dyn = dynamicBySportsDb.get(idLeague)
    if (dyn) return dyn.id
  }
  return 'other'
}

/** Competitions a fan can follow as a whole. Order is display order. */
export const FOLLOWABLE_COMPETITIONS: { group: string; ids: LeagueId[] }[] = [
  { group: 'Continental', ids: ['ucl', 'uel', 'uecl', 'libertadores', 'concacafcc'] },
  { group: 'National teams', ids: ['worldcup', 'euros', 'copaamerica', 'goldcup', 'uefanations', 'concacafnations', 'wcqconcacaf', 'wcqconmebol', 'wcquefa'] },
  { group: 'Cups', ids: ['clubworldcup', 'facup', 'eflcup', 'copadelrey', 'coppaitalia', 'dfbpokal', 'leaguescup', 'usopencup'] },
  { group: 'Every game in a league', ids: ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'mls', 'eredivisie', 'primeira'] },
]

export const LEAGUE_FOLLOW_PREFIX = 'league:'

export function leagueFollowId(id: LeagueId): string {
  return `${LEAGUE_FOLLOW_PREFIX}${id}`
}

export function leagueIdFromFollow(followId: string): LeagueId | null {
  if (!followId.startsWith(LEAGUE_FOLLOW_PREFIX)) return null
  const id = followId.slice(LEAGUE_FOLLOW_PREFIX.length)
  return id in LEAGUES || isDynamicLeagueId(id) ? id : null
}
