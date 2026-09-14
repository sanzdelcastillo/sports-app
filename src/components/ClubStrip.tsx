import { Link } from 'react-router-dom'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { involvesTeam } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { TeamCrest } from './TeamCrest'

/** One tile per followed club: its next game this week and whether you can reach it. */
export function ClubStrip({
  follows,
  fixtures,
  subscribed,
}: {
  follows: string[]
  fixtures: Fixture[]
  subscribed: DestinationId[]
}) {
  const upcoming = fixtures.filter((f) => f.status !== 'final').sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

  return (
    <div className="club-strip" role="list" aria-label="Next game for each club you follow">
      {follows.map((teamId) => {
        const team = getTeam(teamId)
        if (!team) return null
        const next = upcoming.find((f) => involvesTeam(f, teamId))
        if (!next) {
          return (
            <div key={teamId} className="club-tile idle" role="listitem">
              <TeamCrest team={team} size="sm" />
              <span className="club-abbr">{team.shortName}</span>
              <span className="club-when">No game</span>
            </div>
          )
        }
        const kick = formatKickoff(next.kickoffUtc)
        const opponent = getTeam(next.homeTeamId === teamId ? next.awayTeamId : next.homeTeamId)
        const away = next.awayTeamId === teamId
        const access = accessFor(next, subscribed)
        return (
          <Link key={teamId} to={`/game/${next.id}`} className="club-tile" role="listitem">
            <span className={`club-dot ${access.state}`} aria-hidden="true" />
            <TeamCrest team={team} size="sm" />
            <span className="club-abbr">{team.shortName}</span>
            <span className="club-when">
              {next.status === 'live' ? 'Live now' : `${kick.weekday} ${kick.time.replace(/ [A-Z]{2,4}$/, '')}`}
            </span>
            <span className="club-opp">
              {away ? '@' : 'v'} {opponent?.shortName ?? '—'}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
