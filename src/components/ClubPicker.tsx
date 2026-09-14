import { useEffect, useMemo, useState } from 'react'
import { FOLLOWABLE_COMPETITIONS, LEAGUES, leagueFollowId, leagueIdFromFollow } from '../data/leagues'
import { followableTeams, getTeam, registryVersion } from '../data/teams'
import type { LeagueId, Team } from '../domain/types'
import { BROWSABLE_LEAGUES, loadLeagueClubs } from '../services/clubs'
import { useAppState } from '../stores/AppState'
import { TeamCrest } from './TeamCrest'

/**
 * Browse every club in the supported leagues and tap to follow.
 * Static core clubs render instantly; the full league list arrives from the feed and is cached for a week.
 */
export function ClubPicker({ compact = false }: { compact?: boolean }) {
  const { follows, followSet, toggleFollow } = useAppState()
  const [league, setLeague] = useState<LeagueId | 'competitions'>('epl')
  const [query, setQuery] = useState('')
  const [tick, setTick] = useState(registryVersion())
  const [status, setStatus] = useState<'idle' | 'loading' | 'partial'>('idle')

  useEffect(() => {
    if (league === 'competitions') return
    let cancelled = false
    setStatus('loading')
    loadLeagueClubs(league)
      .then((teams) => {
        if (cancelled) return
        setStatus(teams.length ? 'idle' : 'partial')
        setTick(registryVersion())
      })
      .catch(() => {
        if (!cancelled) setStatus('partial')
      })
    return () => {
      cancelled = true
    }
  }, [league])

  const q = query.trim().toLowerCase()
  const clubs = useMemo(() => {
    void tick
    const all = followableTeams()
    const pool = q || league === 'competitions' ? all : all.filter((t) => t.leagueId === league)
    return pool
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [league, q, tick])

  const followed = useMemo(
    () => follows.map((id) => getTeam(id)).filter((t): t is Team => Boolean(t)),
    [follows],
  )
  const followedCompetitions = useMemo(
    () => follows.map(leagueIdFromFollow).filter((id): id is LeagueId => id !== null),
    [follows],
  )

  return (
    <div className="club-picker">
      {followed.length > 0 || followedCompetitions.length > 0 ? (
        <div className="followed-strip" aria-label="What you follow">
          {followedCompetitions.map((id) => (
            <button
              key={id}
              type="button"
              className="followed-chip comp"
              style={{ borderColor: LEAGUES[id].accent, color: LEAGUES[id].accent }}
              onClick={() => toggleFollow(leagueFollowId(id))}
              aria-label={`Unfollow ${LEAGUES[id].name}`}
              title="Tap to unfollow"
            >
              <span>{LEAGUES[id].shortName}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {followed.map((t) => (
            <button
              key={t.id}
              type="button"
              className="followed-chip"
              onClick={() => toggleFollow(t.id)}
              aria-label={`Unfollow ${t.name}`}
              title="Tap to unfollow"
            >
              <TeamCrest team={t} size="sm" />
              <span>{t.shortName}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <input
        className="search"
        type="search"
        placeholder="Search any club"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search clubs"
      />

      {!q ? (
        <div className="league-chips" role="tablist" aria-label="Leagues">
          <button
            type="button"
            role="tab"
            aria-selected={league === 'competitions'}
            className={`league-chip${league === 'competitions' ? ' on' : ''}`}
            onClick={() => setLeague('competitions')}
          >
            Competitions
          </button>
          {BROWSABLE_LEAGUES.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={league === id}
              className={`league-chip${league === id ? ' on' : ''}`}
              onClick={() => setLeague(id)}
            >
              {LEAGUES[id].shortName}
            </button>
          ))}
        </div>
      ) : null}

      {league === 'competitions' && !q ? (
        <div className="competitions">
          <p className="disclaimer">Follow a whole competition and every game in it lands in your week.</p>
          {FOLLOWABLE_COMPETITIONS.map((group) => (
            <div key={group.group}>
              <div className="date-head">{group.group}</div>
              <div className="stack">
                {group.ids.map((id) => {
                  const on = followSet.has(leagueFollowId(id))
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`card comp-row${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => toggleFollow(leagueFollowId(id))}
                    >
                      <span className="comp-swatch" style={{ background: LEAGUES[id].accent }} aria-hidden="true" />
                      <span className="comp-name">{LEAGUES[id].name}</span>
                      <span className={`toggle${on ? ' on' : ''}`}>{on ? 'Following' : 'Follow'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {status === 'loading' && clubs.length === 0 && league !== 'competitions' ? <p className="disclaimer">Loading clubs…</p> : null}
      {status === 'partial' && !q ? (
        <p className="disclaimer">Showing the clubs we have on device. The full league list needs a connection.</p>
      ) : null}

      <div className={`club-grid${compact ? ' compact' : ''}`} hidden={league === 'competitions' && !q}>
        {clubs.map((team) => {
          const on = followSet.has(team.id)
          return (
            <button
              key={team.id}
              type="button"
              className={`club-card${on ? ' on' : ''}`}
              aria-pressed={on}
              onClick={() => toggleFollow(team.id)}
            >
              <TeamCrest team={team} size="md" />
              <span className="club-card-name">{team.name}</span>
              <span className="club-card-state">{on ? 'Following' : 'Follow'}</span>
            </button>
          )
        })}
      </div>
      {clubs.length === 0 && status !== 'loading' && (q || league !== 'competitions') ? (
        <p className="disclaimer">No club matches that search.</p>
      ) : null}
    </div>
  )
}
