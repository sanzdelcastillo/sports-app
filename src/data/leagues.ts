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
}

export function leagueFromSportsDb(
  idLeague?: string | null,
  name?: string | null,
): LeagueId {
  if (idLeague && SPORTSDB_LEAGUE[idLeague]) return SPORTSDB_LEAGUE[idLeague]
  const n = (name ?? '').toLowerCase()
  if (n.includes('champion')) return 'ucl'
  if (n.includes('premier')) return 'epl'
  if (n.includes('la liga') || n.includes('spanish')) return 'laliga'
  if (n.includes('serie')) return 'seriea'
  if (n.includes('ligue')) return 'ligue1'
  if (n.includes('major league') || n.includes('mls')) return 'mls'
  if (n.includes('bundesliga')) return 'bundesliga'
  return 'other'
}
