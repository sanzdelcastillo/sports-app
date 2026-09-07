import type {
  DestinationId,
  Fixture,
  LeagueId,
  WatchAvailability,
  WatchDestination,
} from '../domain/types'

export interface Provider {
  id: DestinationId
  name: string
  shortName: string
  url: string
  blurb: string
}

export const PROVIDERS: Provider[] = [
  {
    id: 'apple-tv-mls',
    name: 'Apple TV · MLS Season Pass',
    shortName: 'Apple TV',
    url: 'https://tv.apple.com/channel/mls-season-pass',
    blurb: 'Typical U.S. home for MLS regular-season matches.',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    shortName: 'Peacock',
    url: 'https://www.peacocktv.com/',
    blurb: 'Typical U.S. home for Premier League matches.',
  },
  {
    id: 'nbc',
    name: 'NBC / USA Network',
    shortName: 'NBC',
    url: 'https://www.nbcsports.com/soccer',
    blurb: 'Secondary — select Premier League linear windows. Not in the default Julio map.',
  },
  {
    id: 'espn-plus',
    name: 'ESPN+',
    shortName: 'ESPN+',
    url: 'https://plus.espn.com/',
    blurb: 'Often carries La Liga and other soccer in the U.S.',
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    shortName: 'Paramount+',
    url: 'https://www.paramountplus.com/',
    blurb: 'Often carries UEFA club competitions and Serie A in the U.S.',
  },
  {
    id: 'cbs-sports',
    name: 'CBS Sports',
    shortName: 'CBS Sports',
    url: 'https://www.cbssports.com/soccer/',
    blurb: 'Secondary — select UCL / Serie A linear windows. Not in the default Julio map.',
  },
  {
    id: 'bein',
    name: 'beIN SPORTS',
    shortName: 'beIN',
    url: 'https://www.beinsports.com/',
    blurb: 'Typical U.S. home for Ligue 1.',
  },
]

export const JULIO_OWNED_IDS: DestinationId[] = [
  'apple-tv-mls',
  'espn-plus',
  'peacock',
  'paramount-plus',
  'bein',
]

export const PROVIDER_BY_ID = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<
  DestinationId,
  Provider
>

/**
 * Default US map = Julio owned set only.
 * Apple TV / MLS Season Pass, ESPN+, Peacock, Paramount+, beIN.
 * NBC / CBS stay on the Watch screen as secondary marks, not default destinations.
 * Rights change — treat as guidance, not a guarantee.
 */
const LEAGUE_PROVIDERS: Partial<Record<LeagueId, DestinationId[]>> = {
  mls: ['apple-tv-mls'],
  epl: ['peacock'],
  laliga: ['espn-plus'],
  seriea: ['paramount-plus'],
  ligue1: ['bein'],
  ucl: ['paramount-plus'],
  bundesliga: ['espn-plus'],
  eredivisie: ['espn-plus'],
  primeira: ['paramount-plus'],
}

/** Destination badge — not the match ● LIVE pill. Live only when the match is in progress. */
export function availabilityFor(status: Fixture['status']): WatchAvailability {
  if (status === 'final') return 'replay'
  if (status === 'live') return 'live'
  if (status === 'scheduled') return 'upcoming'
  return 'unknown'
}

export function destinationsForFixture(
  fixture: Fixture,
  subscribed: DestinationId[],
): WatchDestination[] {
  const ids = LEAGUE_PROVIDERS[fixture.leagueId] ?? []
  const availability = ids.length ? availabilityFor(fixture.status) : 'unknown'
  const owned = new Set(subscribed)

  const mapped: WatchDestination[] = ids.map((id) => {
    const provider = PROVIDER_BY_ID[id]
    return {
      id,
      name: provider.name,
      shortName: provider.shortName,
      url: provider.url,
      availability,
      note: owned.has(id)
        ? 'On a service you marked as subscribed.'
        : 'Opens the provider site. Confirm rights for your region.',
    }
  })

  mapped.sort((a, b) => Number(owned.has(b.id)) - Number(owned.has(a.id)))

  if (mapped.length === 0) {
    mapped.push({
      id: 'unknown',
      name: 'Unknown',
      shortName: 'Unknown',
      url: 'https://www.google.com/search?q=' + encodeURIComponent(`${fixture.leagueName} where to watch`),
      availability: 'unknown',
      note: 'We do not have a confident U.S. destination for this competition.',
    })
  }

  return mapped
}

export function primaryDestination(
  fixture: Fixture,
  subscribed: DestinationId[],
): WatchDestination {
  return destinationsForFixture(fixture, subscribed)[0]
}
