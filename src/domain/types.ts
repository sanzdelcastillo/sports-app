export type WatchAvailability = 'live' | 'replay' | 'upcoming' | 'unknown'

export type FixtureStatus = 'scheduled' | 'live' | 'final' | 'postponed' | 'unknown'

/** Known league ids, plus any league the feed knows about (`l<idLeague>`). */
export type KnownLeagueId =
  | 'mls'
  | 'epl'
  | 'laliga'
  | 'seriea'
  | 'ligue1'
  | 'ucl'
  | 'bundesliga'
  | 'eredivisie'
  | 'primeira'
  | 'eflcup'
  | 'facup'
  | 'communityshield'
  | 'uel'
  | 'uecl'
  | 'uefasupercup'
  | 'copadelrey'
  | 'supercopa'
  | 'coppaitalia'
  | 'supercoppa'
  | 'dfbpokal'
  | 'leaguescup'
  | 'usopencup'
  | 'worldcup'
  | 'euros'
  | 'copaamerica'
  | 'goldcup'
  | 'uefanations'
  | 'concacafnations'
  | 'clubworldcup'
  | 'libertadores'
  | 'concacafcc'
  | 'wcqconcacaf'
  | 'wcqconmebol'
  | 'wcquefa'
  | 'ligamx'
  | 'brasileirao'
  | 'spfl'
  | 'superlig'
  | 'argprimera'
  | 'saudipro'
  | 'other'

export type LeagueId = KnownLeagueId | (string & {})

export type DestinationId =
  | 'apple-tv-mls'
  | 'espn-plus'
  | 'peacock'
  | 'paramount-plus'
  | 'cbs-sports'
  | 'nbc'
  | 'usa-network'
  | 'fandango'
  | 'bein'
  | 'fox'
  | 'univision'
  | 'dazn'
  | 'unknown'

/** How a destination is reached: a paid subscription, a free service, or a linear TV channel. */
export type DestinationKind = 'subscription' | 'free' | 'linear'

/**
 * What the user's own service list says about a fixture's primary destination.
 * Self-reported only — never a verified entitlement.
 *  - owned: the destination is on a service the user marked as theirs
 *  - free: the destination needs no subscription
 *  - missing: we know the destination and the user has not marked it
 *  - unknown: we have no confident U.S. destination
 */
export type AccessState = 'owned' | 'free' | 'missing' | 'unknown'

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
  providerId: string
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
  providerId?: string
  /** Short badge text for tiles (UCL, UEL); shortName is the readable label. */
  code?: string
  /** Season year the provider is currently serving for this league. */
  currentSeason?: number
  country?: string
}

export interface WatchDestination {
  id: DestinationId
  name: string
  shortName: string
  url: string
  kind: DestinationKind
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
  /** Live clock: the minute the source last reported, when we saw it, and the period (1H, HT, 2H, ET, PEN). */
  liveMinute?: number
  liveMinuteAt?: string
  livePeriod?: string
  mustWatch?: boolean
  /** Season label from the data source, e.g. "2026". */
  season?: string
  /** Round or stage label from the source, e.g. "Regular Season - 5" or "Round of 32". */
  round?: string
}

/** Compact record of a fixture as last seen, used to spot schedule changes between visits. */
export interface SeenFixture {
  kickoffUtc: string
  status: FixtureStatus
  statusDetail?: string
}

export type SeenMap = Record<string, SeenFixture>

export type ChangeKind = 'moved' | 'postponed'

export interface FixtureChange {
  fixtureId: string
  kind: ChangeKind
  /** Previous kickoff (ISO UTC) for a move. */
  from?: string
  /** New kickoff (ISO UTC) for a move. */
  to?: string
  detectedAt: string
}

export type DataSource = 'live' | 'cached' | 'seed' | 'mixed'

/** A score call for a game. */
export interface Prediction {
  home: number
  away: number
}
