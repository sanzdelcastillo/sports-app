import { Link } from 'react-router-dom'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import type { DestinationId, Fixture } from '../domain/types'
import { scoreLabel } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { TeamCrest } from './TeamCrest'
import { WatchCta } from './WatchCta'

export function FeaturedGame({
  fixture,
  subscribed,
}: {
  fixture: Fixture
  subscribed: DestinationId[]
}) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = LEAGUES[fixture.leagueId]

  return (
    <article className="card card-featured">
      <div className="match-head">
        <span>
          Next up • {kick.day} • {league.shortName}
        </span>
      </div>
      <Link to={`/game/${fixture.id}`} className="matchup" aria-label={`${home?.name} vs ${away?.name}`}>
        <div className="side">
          <TeamCrest team={home} />
          <div className="abbr">{home?.shortName}</div>
        </div>
        <div className="kick">
          <div className="time">{kick.time}</div>
          <div className="scores" aria-hidden="true">
            <span>{scoreLabel(fixture.homeScore, fixture.status)}</span>
            <span>{scoreLabel(fixture.awayScore, fixture.status)}</span>
          </div>
        </div>
        <div className="side">
          <TeamCrest team={away} />
          <div className="abbr">{away?.shortName}</div>
        </div>
      </Link>
      <div className="row-actions">
        <div className="badges">
          {fixture.status === 'live' ? <span className="badge live">● LIVE</span> : null}
          {fixture.status === 'final' ? <span className="badge">Final</span> : null}
          {fixture.mustWatch ? <span className="badge must">★ Must-watch</span> : null}
        </div>
        <WatchCta fixture={fixture} subscribed={subscribed} />
      </div>
    </article>
  )
}

export function GameRow({ fixture }: { fixture: Fixture }) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const league = LEAGUES[fixture.leagueId]

  return (
    <Link to={`/game/${fixture.id}`} className="card game-row">
      <div className="badges">
        <span className="badge ghost">{league.shortName}</span>
        {fixture.status === 'live' ? <span className="badge live">● LIVE</span> : null}
        {fixture.status === 'final' ? <span className="badge">Final</span> : null}
        {fixture.mustWatch ? <span className="badge must">★ Must-watch</span> : null}
      </div>
      <div className="matchup">
        <div className="side">
          <TeamCrest team={home} size="sm" />
          <div className="abbr">{home?.shortName}</div>
        </div>
        <div className="kick">
          <div className="time" style={{ fontSize: 16 }}>
            {kick.time}
          </div>
          <div className="scores" style={{ fontSize: 18 }}>
            <span>{scoreLabel(fixture.homeScore, fixture.status)}</span>
            <span>{scoreLabel(fixture.awayScore, fixture.status)}</span>
          </div>
        </div>
        <div className="side">
          <TeamCrest team={away} size="sm" />
          <div className="abbr">{away?.shortName}</div>
        </div>
      </div>
    </Link>
  )
}
