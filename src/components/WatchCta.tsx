import { primaryDestination } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
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
  availability: 'live' | 'replay' | 'unknown'
}) {
  const label =
    availability === 'live' ? 'Live' : availability === 'replay' ? 'Replay' : 'Unknown'
  return <span className={`badge ${availability === 'unknown' ? 'ghost' : ''}`}>{label}</span>
}
