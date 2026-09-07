export type WatchAvailability = 'live' | 'replay' | 'upcoming' | 'unknown'

export type FixtureStatus = 'scheduled' | 'live' | 'final' | 'unknown'

export type LeagueId =
  | 'mls'
  | 'epl'
  | 'laliga'
  | 'seriea'
  | 'ligue1'
  | 'ucl'
  | 'bundesliga'
  | 'eredivisie'
  | 'primeira'
  | 'other'

export type DestinationId =
  | 'apple-tv-mls'
  | 'espn-plus'
  | 'peacock'
  | 'paramount-plus'
  | 'cbs-sports'
  | 'nbc'
  | 'bein'
  | 'unknown'

export interface Team {
  id: string
  name: string
  shortName: string
  leagueId: LeagueId
  country: string
  stadium: string
  badgeUrl: string
  espnLogoUrl?: string
  espnId?: string
  sportsDbId: string
  color: string
  colorSecondary: string
  seedFollow?: boolean
  followable?: boolean
}

export interface League {
  id: LeagueId
  name: string
  shortName: string
  accent: string
  sportsDbId?: string
}

export interface WatchDestination {
  id: DestinationId
  name: string
  shortName: string
  url: string
  availability: WatchAvailability
  note: string
}

export interface Fixture {
  id: string
  leagueId: LeagueId
  leagueName: string
  kickoffUtc: string
  venue: string
  homeTeamId: string
  awayTeamId: string
  homeScore: number | null
  awayScore: number | null
  homeRecord?: string
  awayRecord?: string
  status: FixtureStatus
  statusDetail?: string
  mustWatch?: boolean
}

export interface NewsItem {
  id: string
  teamIds: string[]
  headline: string
  summary: string
  source: string
  url: string
  publishedAt: string
}

export interface Reminder {
  fixtureId: string
  createdAt: string
}

export type DataSource = 'live' | 'seed' | 'mixed'
