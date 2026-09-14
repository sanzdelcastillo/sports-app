import type {
  AccessState,
  DestinationId,
  DestinationKind,
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
  kind: DestinationKind
  blurb: string
}

/**
 * When a human last checked this map against U.S. rights announcements.
 * Shown in the UI so a stale map is visible instead of silently wrong.
 */
export const RIGHTS_REVIEWED_ON = '2026-09-13'
export const RIGHTS_SEASON = '2026-27'

export const PROVIDERS: Provider[] = [
  {
    id: 'apple-tv-mls',
    name: 'Apple TV',
    shortName: 'Apple TV',
    url: 'https://tv.apple.com/',
    kind: 'subscription',
    blurb: 'MLS is included with a standard Apple TV subscription for 2026. The separate Season Pass is gone.',
  },
  {
    id: 'peacock',
    name: 'Peacock',
    shortName: 'Peacock',
    url: 'https://www.peacocktv.com/',
    kind: 'subscription',
    blurb: 'All 380 Premier League matches. A few also air on NBC or USA Network.',
  },
  {
    id: 'espn-plus',
    name: 'ESPN+',
    shortName: 'ESPN+',
    url: 'https://plus.espn.com/',
    kind: 'subscription',
    blurb: 'La Liga, plus FA Cup and other cups. Also inside the ESPN Unlimited plan.',
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    shortName: 'Paramount+',
    url: 'https://www.paramountplus.com/',
    kind: 'subscription',
    blurb: 'Champions League, Europa League, Serie A, and Liga Portugal.',
  },
  {
    id: 'bein',
    name: 'beIN SPORTS',
    shortName: 'beIN',
    url: 'https://www.beinsports.com/',
    kind: 'subscription',
    blurb: 'Ligue 1. Usually reached through Fubo, Sling, or a cable package.',
  },
  {
    id: 'fandango',
    name: 'Fandango at Home',
    shortName: 'Fandango',
    url: 'https://www.fandango.com/',
    kind: 'free',
    blurb: 'Most Bundesliga matches stream free here starting with the 2026-27 season.',
  },
  {
    id: 'usa-network',
    name: 'USA Network',
    shortName: 'USA Network',
    url: 'https://www.usanetwork.com/',
    kind: 'linear',
    blurb: 'Select Bundesliga and Premier League matches on cable or a live-TV package.',
  },
  {
    id: 'nbc',
    name: 'NBC',
    shortName: 'NBC',
    url: 'https://www.nbcsports.com/soccer',
    kind: 'linear',
    blurb: 'A handful of Premier League matches on broadcast TV. Free with an antenna.',
  },
  {
    id: 'cbs-sports',
    name: 'CBS Sports',
    shortName: 'CBS Sports',
    url: 'https://www.cbssports.com/soccer/',
    kind: 'linear',
    blurb: 'Occasional Champions League and Serie A matches on CBS or CBS Sports Network.',
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
 * U.S. rights map for the season above. First entry is the primary destination.
 * Rights change — treat as guidance, not a guarantee.
 */
const LEAGUE_PROVIDERS: Partial<Record<LeagueId, DestinationId[]>> = {
  mls: ['apple-tv-mls'],
  epl: ['peacock', 'nbc', 'usa-network'],
  laliga: ['espn-plus'],
  seriea: ['paramount-plus', 'cbs-sports'],
  ligue1: ['bein'],
  ucl: ['paramount-plus', 'cbs-sports'],
  bundesliga: ['fandango', 'usa-network'],
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

function noteFor(kind: DestinationKind, owned: boolean): string {
  if (kind === 'free') return 'No subscription needed. Opens the provider site.'
  if (owned) return 'On a service you marked as yours. We cannot verify access.'
  if (kind === 'linear') return 'A TV channel — needs an antenna, cable, or a live-TV package.'
  return 'Not on your list. Opens the provider site so you can check.'
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
      kind: provider.kind,
      availability,
      note: noteFor(provider.kind, owned.has(id)),
    }
  })

  // Owned first, then free, then everything else in map order.
  const rank = (d: WatchDestination) => (owned.has(d.id) ? 0 : d.kind === 'free' ? 1 : 2)
  mapped.sort((a, b) => rank(a) - rank(b))

  if (mapped.length === 0) {
    mapped.push({
      id: 'unknown',
      name: 'Unknown',
      shortName: 'Unknown',
      url: 'https://www.google.com/search?q=' + encodeURIComponent(`${fixture.leagueName} where to watch`),
      kind: 'subscription',
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

export interface Access {
  state: AccessState
  destination: WatchDestination
  /** Short chip copy, e.g. "In your apps · Peacock" */
  label: string
}

/**
 * What the user's own service list says about this fixture.
 * Self-reported: "owned" means the user ticked the service, nothing more.
 */
export function accessFor(fixture: Fixture, subscribed: DestinationId[]): Access {
  const destination = primaryDestination(fixture, subscribed)
  if (destination.id === 'unknown') {
    return { state: 'unknown', destination, label: 'Where to watch unknown' }
  }
  if (subscribed.includes(destination.id)) {
    return { state: 'owned', destination, label: `In your apps · ${destination.shortName}` }
  }
  if (destination.kind === 'free') {
    return { state: 'free', destination, label: `Free on ${destination.shortName}` }
  }
  return { state: 'missing', destination, label: `Needs ${destination.shortName}` }
}

export interface Coverage {
  total: number
  owned: number
  free: number
  missing: number
  unknown: number
  /** Services that would cover the "missing" games, most useful first. */
  gaps: { id: DestinationId; shortName: string; games: number }[]
}

/** Roll-up for the My Week hero: how many upcoming games the user can already reach. */
export function coverageFor(fixtures: Fixture[], subscribed: DestinationId[]): Coverage {
  const counts: Record<AccessState, number> = { owned: 0, free: 0, missing: 0, unknown: 0 }
  const gapMap = new Map<DestinationId, number>()
  for (const fixture of fixtures) {
    const access = accessFor(fixture, subscribed)
    counts[access.state] += 1
    if (access.state === 'missing') {
      gapMap.set(access.destination.id, (gapMap.get(access.destination.id) ?? 0) + 1)
    }
  }
  const gaps = [...gapMap.entries()]
    .map(([id, games]) => ({ id, shortName: PROVIDER_BY_ID[id].shortName, games }))
    .sort((a, b) => b.games - a.games)
  return { total: fixtures.length, ...counts, gaps }
}
