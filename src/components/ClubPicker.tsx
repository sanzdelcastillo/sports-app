import { useEffect, useMemo, useState } from 'react'
import { FOLLOWABLE_COMPETITIONS, getLeague, leagueFollowId, leagueIdFromFollow } from '../data/leagues'
import { followableTeams, getTeam, registryVersion } from '../data/teams'
import type { LeagueId, Team } from '../domain/types'
import { BROWSABLE_LEAGUES, loadLeagueClubs, searchClubs } from '../services/clubs'
import { leagueForEntry, loadLeagueDirectory, popularLeagues, searchLeagues, type DirectoryEntry } from '../services/leagues'
import { useAppState } from '../stores/AppState'
import { TeamCrest } from './TeamCrest'

/**
 * Browse every club in the supported leagues and tap to follow.
 * Static core clubs render instantly; the full league list arrives from the feed and is cached for a week.
 */
export function ClubPicker({ compact = false }: { compact?: boolean }) {
  const { follows, followSet, toggleFollow } = useAppState()
  const [league, setLeague] = useState<LeagueId | 'competitions' | 'leagues'>('epl')
  const [directory, setDirectory] = useState<DirectoryEntry[] | null>(null)
  const [leagueQuery, setLeagueQuery] = useState('')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const [tick, setTick] = useState(registryVersion())
  const [status, setStatus] = useState<'idle' | 'loading' | 'partial'>('idle')
  const [remote, setRemote] = useState<{ q: string; teams: Team[] } | null>(null)

  useEffect(() => {
    if ((league !== 'leagues' && q.length < 3) || directory) return
    let cancelled = false
    void loadLeagueDirectory().then((d) => {
      if (!cancelled) setDirectory(d)
    })
    return () => {
      cancelled = true
    }
  }, [league, directory, q])

  useEffect(() => {
    if (league === 'competitions' || league === 'leagues') return
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

  // Any club in the world: after three letters, ask the provider and merge with what's on device.
  useEffect(() => {
    if (q.length < 3) {
      setRemote(null)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      searchClubs(q)
        .then((teams) => {
          if (!cancelled) {
            setRemote({ q, teams })
            setTick(registryVersion())
          }
        })
        .catch(() => undefined)
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [q])

  const clubs = useMemo(() => {
    void tick
    const all = followableTeams()
    const pool = q || league === 'competitions' || league === 'leagues' ? all : all.filter((t) => t.leagueId === league)
    const local = pool.filter((t) => !q || t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q))
    const extra = remote && remote.q === q ? remote.teams.filter((t) => !local.some((l) => l.id === t.id)) : []
    return [...local, ...extra].sort((a, b) => a.name.localeCompare(b.name))
  }, [league, q, tick, remote])

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
              style={{ borderColor: getLeague(id).accent, color: getLeague(id).accent }}
              onClick={() => toggleFollow(leagueFollowId(id))}
              aria-label={`Unfollow ${getLeague(id).name}`}
              title="Tap to unfollow"
            >
              <span>{getLeague(id).shortName}</span>
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
        placeholder="Search any club or league"
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
              {getLeague(id).shortName}
            </button>
          ))}
          {league !== 'competitions' && league !== 'leagues' && !BROWSABLE_LEAGUES.includes(league) ? (
            <button type="button" role="tab" aria-selected className="league-chip on">
              {getLeague(league).shortName}
            </button>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={league === 'leagues'}
            className={`league-chip${league === 'leagues' ? ' on' : ''}`}
            onClick={() => setLeague('leagues')}
          >
            All leagues
          </button>
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
                      <span className="comp-swatch" style={{ background: getLeague(id).accent }} aria-hidden="true" />
                      <span className="comp-name">{getLeague(id).name}</span>
                      <span className={`toggle${on ? ' on' : ''}`}>{on ? 'Following' : 'Follow'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {league === 'leagues' && !q ? (
        <div className="league-finder">
          <input
            className="search"
            type="search"
            placeholder="Country or league — Argentina, Saudi, Denmark…"
            value={leagueQuery}
            onChange={(e) => setLeagueQuery(e.target.value)}
            aria-label="Search leagues"
          />
          {!directory ? <p className="disclaimer">Loading every league…</p> : null}
          {directory ? (
            <>
              <div className="date-head">{leagueQuery.trim() ? 'Matches' : 'Popular'}</div>
              <div className="stack">
                {(leagueQuery.trim() ? searchLeagues(directory, leagueQuery) : popularLeagues(directory)).map((entry) => {
                  const l = leagueForEntry(entry)
                  const followId = leagueFollowId(l.id)
                  const on = followSet.has(followId)
                  return (
                    <div key={entry.id} className="card comp-row static">
                      <span className="comp-swatch" style={{ background: l.accent }} aria-hidden="true" />
                      <span className="comp-name">
                        {entry.name}
                        {entry.country && entry.country !== 'World' ? <span className="comp-country">{entry.country}</span> : null}
                      </span>
                      <span className="league-actions">
                        <button type="button" className="text-btn" onClick={() => setLeague(l.id)}>
                          Clubs ›
                        </button>
                        <button type="button" className={`toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleFollow(followId)}>
                          {on ? 'Following' : 'Follow all'}
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
              {leagueQuery.trim() && searchLeagues(directory, leagueQuery).length === 0 ? (
                <p className="disclaimer">No league matches that. Try the country's name in English.</p>
              ) : null}
              <p className="source-note">{directory.length} leagues and cups available. "Follow all" adds every game; "Clubs" lets you pick teams.</p>
            </>
          ) : null}
        </div>
      ) : null}

      {status === 'loading' && clubs.length === 0 && league !== 'competitions' && league !== 'leagues' ? <p className="disclaimer">Loading clubs…</p> : null}
      {status === 'partial' && !q ? (
        <p className="disclaimer">Showing the clubs we have on device. The full league list needs a connection.</p>
      ) : null}

      {q.length >= 3 && directory ? (
        (() => {
          const found = searchLeagues(directory, q, 5)
          return found.length ? (
            <div className="search-leagues">
              <div className="date-head">Competitions</div>
              <div className="stack">
                {found.map((entry) => {
                  const l = leagueForEntry(entry)
                  const followId = leagueFollowId(l.id)
                  const on = followSet.has(followId)
                  return (
                    <div key={entry.id} className="card comp-row static">
                      <span className="comp-swatch" style={{ background: l.accent }} aria-hidden="true" />
                      <span className="comp-name">
                        {entry.name}
                        {entry.country && entry.country !== 'World' ? <span className="comp-country">{entry.country}</span> : null}
                      </span>
                      <span className="league-actions">
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => {
                            setQuery('')
                            setLeague(l.id)
                          }}
                        >
                          Clubs ›
                        </button>
                        <button type="button" className={`toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleFollow(followId)}>
                          {on ? 'Following' : 'Follow all'}
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="date-head">Clubs</div>
            </div>
          ) : null
        })()
      ) : null}

      <div className={`club-grid${compact ? ' compact' : ''}`} hidden={(league === 'competitions' || league === 'leagues') && !q}>
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
      {clubs.length === 0 && status !== 'loading' && (q || (league !== 'competitions' && league !== 'leagues')) ? (
        <p className="disclaimer">No club matches that search.</p>
      ) : null}
    </div>
  )
}
