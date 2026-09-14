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
  if (n.includes('premier')) return 'epl'
  if (n.includes('la liga') || n.includes('spanish')) return 'laliga'
  if (n.includes('serie')) return 'seriea'
  if (n.includes('ligue')) return 'ligue1'
  if (n.includes('major league') || n.includes('mls')) return 'mls'
  if (n.includes('bundesliga')) return 'bundesliga'
  return 'other'
}
