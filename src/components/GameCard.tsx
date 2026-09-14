import { Link } from 'react-router-dom'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import type { DestinationId, Fixture, Team } from '../domain/types'
import { scoreLabel } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { useAppState } from '../stores/AppState'
import { BookmarkIcon } from './icons'
import { TeamCrest } from './TeamCrest'
import { AccessChip, WatchCta } from './WatchCta'

/** "3:00 PM EDT" → { clock: "3:00", rest: "PM EDT" } */
function splitTime(time: string): { clock: string; rest: string } {
  const i = time.indexOf(' ')
  if (i === -1) return { clock: time, rest: '' }
  return { clock: time.slice(0, i), rest: time.slice(i + 1) }
}

function liveMinute(fixture: Fixture): string {
  const detail = fixture.statusDetail
  if (detail && detail.toLowerCase() !== 'live') return detail
  return 'Live'
}

function useMasked(fixture: Fixture): boolean {
  const { hideScores, isSavedForLater } = useAppState()
  // A game saved for later never leaks its score, whatever the global setting says.
  return (hideScores || isSavedForLater(fixture.id)) && fixture.status !== 'scheduled'
}

export function featuredKicker(fixture: Fixture): string {
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = LEAGUES[fixture.leagueId]
  const prefix = fixture.status === 'live' ? 'Now' : 'Next up'
  return `${prefix} — ${kick.day} — ${league.shortName}`
}

export function ChangeBadge({ fixtureId }: { fixtureId: string }) {
  const { changeFor } = useAppState()
  const change = changeFor(fixtureId)
  if (!change) return null
  if (change.kind === 'postponed') return <span className="badge warn">Postponed</span>
  const was = change.from ? formatKickoff(change.from) : null
  return (
    <span className="badge moved" title={was ? `Was ${was.day} ${was.time}` : undefined}>
      Moved{was ? ` — was ${was.time}` : ''}
    </span>
  )
}

export function SaveLaterButton({ fixtureId, compact = false }: { fixtureId: string; compact?: boolean }) {
  const { isSavedForLater, toggleWatchLater } = useAppState()
  const saved = isSavedForLater(fixtureId)
  return (
    <button
      type="button"
      className={`icon-btn${compact ? ' compact' : ''}`}
      aria-label={saved ? 'Remove from catch up later' : 'Save to catch up later'}
      aria-pressed={saved}
      title={saved ? 'Saved — score stays hidden until you mark it watched' : 'Save for later — hides the score'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleWatchLater(fixtureId)
      }}
    >
      <BookmarkIcon width={compact ? 16 : 20} height={compact ? 16 : 20} filled={saved} />
    </button>
  )
}

/** Left column of a listing row: kickoff, live minute, or FT. */
function When({ fixture, masked }: { fixture: Fixture; masked: boolean }) {
  const kick = formatKickoff(fixture.kickoffUtc)
  if (fixture.status === 'live') {
    return (
      <div className="when when-live">
        <span className="pulse-dot" aria-hidden="true" />
        <span className="when-clock">{liveMinute(fixture)}</span>
        <span className="when-rest">live</span>
      </div>
    )
  }
  if (fixture.status === 'final') {
    return (
      <div className="when when-ft">
        <span className="when-clock">{masked ? 'Played' : 'FT'}</span>
        <span className="when-rest">{kick.weekday}</span>
      </div>
    )
  }
  const { clock, rest } = splitTime(kick.time)
  return (
    <div className="when">
      <span className="when-clock">{clock}</span>
      <span className="when-rest">{rest}</span>
    </div>
  )
}

function TeamLine({
  team,
  score,
  status,
  masked,
  size = 'sm',
}: {
  team?: Team
  score: number | null
  status: Fixture['status']
  masked: boolean
  size?: 'sm' | 'md'
}) {
  const showScore = status !== 'scheduled'
  return (
    <div className="team-line">
      <TeamCrest team={team} size={size === 'md' ? 'md' : 'sm'} />
      <span className="team-name">{team?.name ?? '—'}</span>
      {showScore ? (
        <span className={`team-score${masked ? ' masked' : ''}`} aria-label={masked ? 'Score hidden' : undefined}>
          {masked ? '·' : scoreLabel(score, status)}
        </span>
      ) : null}
    </div>
  )
}

function Rail({ fixture, subscribed }: { fixture: Fixture; subscribed: DestinationId[] }) {
  const league = LEAGUES[fixture.leagueId]
  return (
    <div className="fixture-rail">
      <span className="mono-label">{league.shortName}</span>
      <AccessChip fixture={fixture} subscribed={subscribed} />
      <ChangeBadge fixtureId={fixture.id} />
      {fixture.mustWatch ? (
        <span className="badge must star" role="img" aria-label="Must-watch" title="Must-watch">
          ★
        </span>
      ) : null}
    </div>
  )
}

function Actions({ fixture, subscribed }: { fixture: Fixture; subscribed: DestinationId[] }) {
  return (
    <div className="fixture-actions">
      <SaveLaterButton fixtureId={fixture.id} compact />
      <WatchCta fixture={fixture} subscribed={subscribed} compact />
    </div>
  )
}

/** Programme-style listing row: kickoff on the left, teams stacked, actions beneath. */
export function GameRow({ fixture, subscribed }: { fixture: Fixture; subscribed: DestinationId[] }) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const masked = useMasked(fixture)

  return (
    <article className="fixture">
      <Link to={`/game/${fixture.id}`} className="fixture-main" aria-label={`${home?.name} vs ${away?.name}`}>
        <When fixture={fixture} masked={masked} />
        <div className="fixture-body">
          <Rail fixture={fixture} subscribed={subscribed} />
          <TeamLine team={home} score={fixture.homeScore} status={fixture.status} masked={masked} />
          <TeamLine team={away} score={fixture.awayScore} status={fixture.status} masked={masked} />
        </div>
      </Link>
      <Actions fixture={fixture} subscribed={subscribed} />
    </article>
  )
}

/** The one dark panel on My Week: the next (or live) game as a scoreboard. */
export function FeaturedGame({ fixture, subscribed }: { fixture: Fixture; subscribed: DestinationId[] }) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const masked = useMasked(fixture)
  const kick = formatKickoff(fixture.kickoffUtc)
  const { clock, rest } = splitTime(kick.time)

  return (
    <article className="featured">
      <Link to={`/game/${fixture.id}`} className="featured-main" aria-label={`${home?.name} vs ${away?.name}`}>
        <div className="featured-top">
          <span className="mono-label light">{featuredKicker(fixture)}</span>
          <div className="badges">
            <AccessChip fixture={fixture} subscribed={subscribed} />
            <ChangeBadge fixtureId={fixture.id} />
            {fixture.mustWatch ? <span className="badge must">★ Must-watch</span> : null}
          </div>
        </div>
        <div className="featured-grid">
          <div className="featured-when">
            {fixture.status === 'live' ? (
              <>
                <span className="pulse-dot" aria-hidden="true" />
                <span className="featured-clock">{liveMinute(fixture)}</span>
              </>
            ) : fixture.status === 'final' ? (
              <span className="featured-clock">{masked ? 'Played' : 'FT'}</span>
            ) : (
              <>
                <span className="featured-clock">{clock}</span>
                <span className="featured-rest">{rest}</span>
              </>
            )}
          </div>
          <div className="featured-teams">
            <TeamLine team={home} score={fixture.homeScore} status={fixture.status} masked={masked} size="md" />
            <TeamLine team={away} score={fixture.awayScore} status={fixture.status} masked={masked} size="md" />
          </div>
        </div>
        <div className="featured-venue mono-label light">{fixture.venue}</div>
      </Link>
      <Actions fixture={fixture} subscribed={subscribed} />
    </article>
  )
}

/** Side-by-side scoreboard used on the game page. */
export function Scoreboard({
  fixture,
  size = 'sm',
  names = 'short',
}: {
  fixture: Fixture
  size?: 'sm' | 'lg'
  names?: 'short' | 'full'
}) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const masked = useMasked(fixture)
  const crestSize = size === 'lg' ? 'lg' : 'sm'
  const showRecords = names === 'full' || Boolean(fixture.awayRecord || fixture.homeRecord)

  const centre =
    fixture.status === 'live'
      ? liveMinute(fixture)
      : fixture.status === 'final'
        ? masked
          ? 'Played'
          : 'Full time'
        : kick.time

  return (
    <div className={`scoreboard ${size}`}>
      <div className="scoreboard-clock-row">
        <span className={`score${masked ? ' masked' : ''}`} aria-label={masked ? 'Score hidden' : undefined}>
          {masked ? '·' : scoreLabel(fixture.homeScore, fixture.status)}
        </span>
        <span className="clock">
          {fixture.status === 'live' ? <span className="pulse-dot" aria-hidden="true" /> : null}
          {centre}
        </span>
        <span className={`score${masked ? ' masked' : ''}`} aria-label={masked ? 'Score hidden' : undefined}>
          {masked ? '·' : scoreLabel(fixture.awayScore, fixture.status)}
        </span>
      </div>
      <div className="scoreboard-teams">
        <div className="side">
          <TeamCrest team={home} size={crestSize} />
          <div className={names === 'full' ? 'name' : 'abbr'}>{names === 'full' ? home?.name : home?.shortName}</div>
          {showRecords && fixture.homeRecord ? <div className="record">{fixture.homeRecord}</div> : null}
        </div>
        <div className="side">
          <TeamCrest team={away} size={crestSize} />
          <div className={names === 'full' ? 'name' : 'abbr'}>{names === 'full' ? away?.name : away?.shortName}</div>
          {showRecords && fixture.awayRecord ? <div className="record">{fixture.awayRecord}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function GameCardSkeleton() {
  return (
    <div className="fixture skeleton-card" aria-hidden="true">
      <div className="skeleton-line when" />
      <div className="skeleton-body">
        <div className="skeleton-line rail" />
        <div className="skeleton-line team" />
        <div className="skeleton-line team" />
      </div>
    </div>
  )
}
