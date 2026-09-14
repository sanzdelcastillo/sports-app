import type { League, LeagueId } from '../domain/types'

export const LEAGUES: Record<LeagueId, League> = {
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
}

export function leagueFromSportsDb(
  idLeague?: string | null,
  name?: string | null,
): LeagueId {
  if (idLeague && SPORTSDB_LEAGUE[idLeague]) return SPORTSDB_LEAGUE[idLeague]
  const n = (name ?? '').toLowerCase()
  if (n.includes('champions league')) return 'ucl'
  if (n.includes('europa league')) return 'uel'
  if (n.includes('conference league')) return 'uecl'
  if (n.includes('efl cup') || n.includes('carabao') || n.includes('league cup')) return 'eflcup'
  if (n.includes('fa cup')) return 'facup'
  if (n.includes('copa del rey')) return 'copadelrey'
  if (n.includes('coppa italia')) return 'coppaitalia'
  if (n.includes('dfb')) return 'dfbpokal'
  if (n.includes('leagues cup')) return 'leaguescup'
  if (n.includes('open cup')) return 'usopencup'
  if (n.includes('club world cup')) return 'clubworldcup'
  if (n.includes('world cup') && n.includes('qualif')) return 'other'
  if (n.includes('world cup')) return 'worldcup'
  if (n.includes('copa america') || n.includes('copa américa')) return 'copaamerica'
  if (n.includes('gold cup')) return 'goldcup'
  if (n.includes('libertadores')) return 'libertadores'
  if (n.includes('premier')) return 'epl'
  if (n.includes('la liga') || n.includes('spanish')) return 'laliga'
  if (n.includes('serie')) return 'seriea'
  if (n.includes('ligue')) return 'ligue1'
  if (n.includes('major league') || n.includes('mls')) return 'mls'
  if (n.includes('bundesliga')) return 'bundesliga'
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
  const id = followId.slice(LEAGUE_FOLLOW_PREFIX.length) as LeagueId
  return id in LEAGUES ? id : null
}
