import { accessFor } from '../data/watch'
import type { AccessState, DestinationId, Fixture, WatchAvailability } from '../domain/types'
import { openExternal } from '../native/external'
import { CheckIcon } from './icons'

export function WatchCta({
  fixture,
  subscribed,
  wide = false,
  compact = false,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
  wide?: boolean
  compact?: boolean
}) {
  const access = accessFor(fixture, subscribed)
  const dest = access.destination
  const label =
    access.state === 'unknown'
      ? 'Find where to watch ↗'
      : access.state === 'free'
        ? `Watch free on ${dest.shortName} ↗`
        : access.state === 'missing'
          ? `Check ${dest.shortName} ↗`
          : `Open in ${dest.shortName} ↗`

  const size = wide ? ' wide' : compact ? ' compact' : ''

  return (
    <a
      className={`cta glass-pill${size}`}
      href={dest.url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void openExternal(dest.url)
      }}
    >
      {label}
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
      ? 'LIVE'
      : availability === 'replay'
        ? 'Replay'
        : availability === 'upcoming'
          ? 'Upcoming'
          : 'Unknown'
  const tone =
    availability === 'live' ? 'live' : availability === 'unknown' || availability === 'upcoming' ? 'ghost' : ''
  return (
    <span className={`badge ${tone}`.trim()}>
      {availability === 'live' ? <span className="pulse-dot" aria-hidden="true" /> : null}
      {label}
    </span>
  )
}

export function MatchStatusBadge({ status }: { status: Fixture['status'] }) {
  if (status === 'live') {
    return (
      <span className="badge live">
        <span className="pulse-dot" aria-hidden="true" />
        LIVE
      </span>
    )
  }
  if (status === 'final') return <span className="badge">Final</span>
  if (status === 'scheduled') return <span className="badge ghost">Upcoming</span>
  return <span className="badge ghost">Unknown</span>
}

/**
 * One chip that answers "can I reach this?" from the user's own service list.
 * Green = a service they ticked. Cyan = free. Outlined = they'd need it. Muted = unknown.
 */
export function AccessChip({
  fixture,
  subscribed,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
}) {
  const access = accessFor(fixture, subscribed)
  const tone: Record<AccessState, string> = {
    owned: 'access-owned',
    free: 'access-free',
    missing: 'access-missing',
    unknown: 'ghost',
  }
  return (
    <span className={`badge ${tone[access.state]}`} title={access.destination.note}>
      {access.state === 'owned' ? <CheckIcon width={12} height={12} aria-hidden="true" /> : null}
      {access.label}
    </span>
  )
}

export function OwnedChip({ owned }: { owned: boolean }) {
  return (
    <span className="badge chip-owned">
      {owned ? <CheckIcon width={12} height={12} aria-hidden="true" /> : null}
      {owned ? 'In your apps' : 'Not in your list'}
    </span>
  )
}

export function isOwnedDestination(id: DestinationId, subscribed: DestinationId[]): boolean {
  return id !== 'unknown' && subscribed.includes(id)
}
