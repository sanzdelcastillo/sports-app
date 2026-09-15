import { Link } from 'react-router-dom'
import { getLeague, leagueIdFromFollow } from '../data/leagues'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { involvesTeam } from '../lib/status'
import { formatKickoff } from '../lib/time'
import { readLastGood } from '../services/fixtures'
import { fetchNextLeagueFixture } from '../services/apiFootball'
import { useEffect, useState } from 'react'
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
  const followedLeagues = follows.map(leagueIdFromFollow).filter((id): id is NonNullable<typeof id> => id !== null)
  const upcoming = fixtures.filter((f) => f.status !== 'final').sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))
  const [nextKnown, setNextKnown] = useState<Record<string, Fixture | null>>({})

  // Competitions with nothing in the window: ask once for their next date.
  useEffect(() => {
    let cancelled = false
    const idle = followedLeagues.filter((id) => !upcoming.some((f) => f.leagueId === id) && !nextBeyondWeek(id) && !(id in nextKnown))
    if (!idle.length) return
    void Promise.all(idle.map((id) => fetchNextLeagueFixture(getLeague(id)).catch(() => null))).then((results) => {
      if (cancelled) return
      setNextKnown((prev) => {
        const out = { ...prev }
        idle.forEach((id, i) => (out[id] = results[i]))
        return out
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [follows.join(','), upcoming.length])

  return (
    <div className="club-strip" role="list" aria-label="Next game for everything you follow">
      {followedLeagues.map((leagueId) => {
        const league = getLeague(leagueId)
        const thisWeek = upcoming.filter((f) => f.leagueId === leagueId)
        const next = thisWeek[0] ?? nextBeyondWeek(leagueId) ?? nextKnown[leagueId] ?? undefined
        const inWeek = thisWeek.length > 0
        const body = (
          <>
            <span className="comp-badge" style={{ background: league.accent }} aria-hidden="true">
              {(league.code ?? league.shortName.slice(0, 3)).toUpperCase()}
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
