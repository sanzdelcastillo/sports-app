import { Link } from 'react-router-dom'
import { LEAGUES, leagueIdFromFollow } from '../data/leagues'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { involvesTeam } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { readLastGood } from '../services/fixtures'
import { TeamCrest } from './TeamCrest'

function nextBeyondWeek(leagueId: string): Fixture | undefined {
  const now = new Date().toISOString()
  return (readLastGood()?.fixtures ?? [])
    .filter((f) => f.leagueId === leagueId && f.kickoffUtc > now)
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))[0]
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

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
    <div className="club-strip" role="list" aria-label="Next game for everything you follow">
      {follows.map(leagueIdFromFollow).filter((id): id is NonNullable<typeof id> => id !== null).map((leagueId) => {
        const league = LEAGUES[leagueId]
        const thisWeek = upcoming.filter((f) => f.leagueId === leagueId)
        const next = thisWeek[0] ?? nextBeyondWeek(leagueId)
        const inWeek = thisWeek.length > 0
        const body = (
          <>
            <span className="comp-badge" style={{ background: league.accent }} aria-hidden="true">
              {league.shortName.slice(0, 3).toUpperCase()}
            </span>
            <span className="club-abbr">{league.shortName}</span>
            <span className="club-when">
              {inWeek
                ? `${thisWeek.length} game${thisWeek.length === 1 ? '' : 's'}`
                : next
                  ? `Next ${shortDate(next.kickoffUtc)}`
                  : 'No dates yet'}
            </span>
          </>
        )
        return inWeek ? (
          <Link key={leagueId} to={`/game/${next!.id}`} className="club-tile" role="listitem">
            {body}
          </Link>
        ) : (
          <div key={leagueId} className="club-tile idle" role="listitem">
            {body}
          </div>
        )
      })}
      {follows.filter((id) => !id.startsWith('league:')).map((teamId) => {
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
