import { primaryDestination } from '../data/watch'
import type { DestinationId, Fixture, WatchAvailability } from '../domain/types'
import { ExternalIcon } from './icons'

export function WatchCta({
  fixture,
  subscribed,
  wide = false,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
  wide?: boolean
}) {
  const dest = primaryDestination(fixture, subscribed)
  const label =
    dest.id === 'unknown' ? 'Find where to watch ↗' : `Open in ${dest.shortName} ↗`

  return (
    <a
      className={`cta${wide ? ' wide' : ''}`}
      href={dest.url}
      target="_blank"
      rel="noreferrer"
    >
      {label}
      <ExternalIcon width={16} height={16} />
    </a>
  )
}

export function AvailabilityBadge({
  availability,
}: {
  availability: WatchAvailability
}) {
  const label =
    availability === 'live'
      ? 'Live'
      : availability === 'replay'
        ? 'Replay'
        : availability === 'upcoming'
          ? 'Upcoming'
          : 'Unknown'
  const tone =
    availability === 'live' ? 'live' : availability === 'unknown' || availability === 'upcoming' ? 'ghost' : ''
  return <span className={`badge ${tone}`.trim()}>{label}</span>
}
