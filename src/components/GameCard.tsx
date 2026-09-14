import { Link } from 'react-router-dom'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import type { DestinationId, Fixture } from '../domain/types'
import { scoreLabel } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { useAppState } from '../stores/AppState'
import { BookmarkIcon } from './icons'
import { TeamCrest } from './TeamCrest'
import { AccessChip, MatchStatusBadge, WatchCta } from './WatchCta'

function clockLabel(fixture: Fixture, time: string): string {
  if (fixture.status === 'final') {
    return fixture.statusDetail && fixture.statusDetail !== 'FT' ? fixture.statusDetail : 'FT'
  }
  if (fixture.status === 'live') {
    const detail = fixture.statusDetail
    if (detail && detail.toLowerCase() !== 'live') return detail
    return time
  }
  return time
}

export function featuredKicker(fixture: Fixture): string {
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = LEAGUES[fixture.leagueId]
  const prefix = fixture.status === 'live' ? 'NOW' : 'NEXT UP'
  return `${prefix} · ${kick.day} · ${league.shortName}`
}

export function Scoreboard({
  fixture,
  size = 'sm',
  names = 'short',
}: {
  fixture: Fixture
  size?: 'sm' | 'lg'
  names?: 'short' | 'full'
}) {
  const { hideScores, isSavedForLater } = useAppState()
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const crestSize = size === 'lg' ? 'lg' : 'sm'
  const showRecords = names === 'full' || Boolean(fixture.awayRecord || fixture.homeRecord)
  // A game saved for later never leaks its score, whatever the global setting says.
  const masked = (hideScores || isSavedForLater(fixture.id)) && fixture.status !== 'scheduled'

  return (
    <div className={`scoreboard ${size}`}>
      <div className="scoreboard-clock-row">
        <span className={`score${masked ? ' masked' : ''}`} aria-label={masked ? 'Score hidden' : undefined}>
          {masked ? '·' : scoreLabel(fixture.awayScore, fixture.status)}
        </span>
        <span className="clock">{masked && fixture.status === 'final' ? 'Played' : clockLabel(fixture, kick.time)}</span>
        <span className={`score${masked ? ' masked' : ''}`} aria-label={masked ? 'Score hidden' : undefined}>
          {masked ? '·' : scoreLabel(fixture.homeScore, fixture.status)}
        </span>
      </div>
      <div className="scoreboard-teams">
        <div className="side">
          <TeamCrest team={away} size={crestSize} />
          <div className={names === 'full' ? 'name' : 'abbr'}>
            {names === 'full' ? away?.name : away?.shortName}
          </div>
          {showRecords && fixture.awayRecord ? <div className="record">{fixture.awayRecord}</div> : null}
        </div>
        <div className="side">
          <TeamCrest team={home} size={crestSize} />
          <div className={names === 'full' ? 'name' : 'abbr'}>
            {names === 'full' ? home?.name : home?.shortName}
          </div>
          {showRecords && fixture.homeRecord ? <div className="record">{fixture.homeRecord}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function ChangeBadge({ fixtureId }: { fixtureId: string }) {
  const { changeFor } = useAppState()
  const change = changeFor(fixtureId)
  if (!change) return null
  if (change.kind === 'postponed') return <span className="badge warn">Postponed</span>
  const was = change.from ? formatKickoff(change.from) : null
  return (
    <span className="badge moved" title={was ? `Was ${was.day} ${was.time}` : undefined}>
      Moved{was ? ` · was ${was.time}` : ''}
    </span>
  )
}

function CardRail({ fixture }: { fixture: Fixture }) {
  const league = LEAGUES[fixture.leagueId]
  return (
    <div className="card-rail">
      <span className="badge ghost">{league.shortName}</span>
      <MatchStatusBadge status={fixture.status} />
      <ChangeBadge fixtureId={fixture.id} />
    </div>
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

function CardActions({
  fixture,
  subscribed,
  compact,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
  compact?: boolean
}) {
  return (
    <div className="row-actions">
      <div className="badges">
        <AccessChip fixture={fixture} subscribed={subscribed} />
        {fixture.mustWatch ? <span className="badge must">★ Must-watch</span> : null}
      </div>
      <div className="row-tools">
        <SaveLaterButton fixtureId={fixture.id} compact />
        <WatchCta fixture={fixture} subscribed={subscribed} compact={compact} />
      </div>
    </div>
  )
}

export function FeaturedGame({
  fixture,
  subscribed,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
}) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)

  return (
    <article className="card card-featured">
      <Link to={`/game/${fixture.id}`} className="game-card-main" aria-label={`${away?.name} vs ${home?.name}`}>
        <CardRail fixture={fixture} />
        <Scoreboard fixture={fixture} size="sm" names="short" />
      </Link>
      <CardActions fixture={fixture} subscribed={subscribed} compact />
    </article>
  )
}

export function GameRow({
  fixture,
  subscribed,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
}) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)

  return (
    <article className="card game-row">
      <Link to={`/game/${fixture.id}`} className="game-card-main" aria-label={`${away?.name} vs ${home?.name}`}>
        <CardRail fixture={fixture} />
        <Scoreboard fixture={fixture} size="sm" names="short" />
      </Link>
      <CardActions fixture={fixture} subscribed={subscribed} compact />
    </article>
  )
}

export function GameCardSkeleton() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton-line rail" />
      <div className="skeleton-scoreboard">
        <div className="skeleton-line score" />
        <div className="skeleton-line clock" />
        <div className="skeleton-line score" />
      </div>
      <div className="skeleton-crests">
        <div className="skeleton-crest" />
        <div className="skeleton-crest" />
      </div>
      <div className="skeleton-line cta" />
    </div>
  )
}
