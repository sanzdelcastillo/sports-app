import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTeam } from '../data/teams'
import type { Team } from '../domain/types'
import { fetchSquad, MAX_PLAYERS, searchPlayers, type FollowedPlayer } from '../services/players'
import { useAppState } from '../stores/AppState'
import { PlayerFace } from './PlayerFace'

const POSITION_ORDER: Record<string, number> = { Goalkeeper: 0, Defender: 1, Midfielder: 2, Attacker: 3 }

function FollowButton({ player }: { player: FollowedPlayer }) {
  const { isPlayerFollowed, followPlayer, unfollowPlayer, players } = useAppState()
  const on = isPlayerFollowed(player.id)
  const full = !on && players.length >= MAX_PLAYERS
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      aria-pressed={on}
      disabled={full}
      title={full ? `Up to ${MAX_PLAYERS} players` : undefined}
      onClick={() => (on ? unfollowPlayer(player.id) : followPlayer(player))}
    >
      {on ? 'Following' : full ? 'Full' : 'Follow'}
    </button>
  )
}

function PlayerRow({ player, showTeam = true }: { player: FollowedPlayer; showTeam?: boolean }) {
  const navigate = useNavigate()
  return (
    <div
      className="card player-row tappable"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/player/${player.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/player/${player.id}`)
      }}
    >
      <PlayerFace player={player} size="md" />
      <span className="player-meta">
        <span className="player-name">{player.name}</span>
        <span className="player-sub">
          {[player.position, player.number ? `#${player.number}` : null, showTeam ? player.teamName : null, player.nationality].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <FollowButton player={player} />
      </span>
    </div>
  )
}

/** Favourite players: search anyone, or pick from the squads of the clubs you follow. */
export function PlayerPicker() {
  const { follows, players } = useAppState()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ q: string; players: FollowedPlayer[] } | null>(null)
  const [searching, setSearching] = useState(false)
  const [openClub, setOpenClub] = useState<string | null>(null)
  const [squads, setSquads] = useState<Record<string, FollowedPlayer[]>>({})

  const clubs = useMemo(() => follows.map((id) => getTeam(id)).filter((t): t is Team => Boolean(t && t.providerId)), [follows])
  const q = query.trim()

  useEffect(() => {
    if (q.length < 4) {
      setResults(null)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = window.setTimeout(() => {
      searchPlayers(q)
        .then((list) => {
          if (!cancelled) setResults({ q, players: list })
        })
        .catch(() => {
          if (!cancelled) setResults({ q, players: [] })
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [q])

  useEffect(() => {
    if (!openClub || squads[openClub]) return
    let cancelled = false
    fetchSquad(openClub)
      .then((list) => {
        if (!cancelled) setSquads((prev) => ({ ...prev, [openClub]: list }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [openClub, squads])

  return (
    <div className="player-picker">
      <p className="disclaimer">
        Up to {MAX_PLAYERS} players. You'll get their season numbers, injury news and headlines. {players.length}/{MAX_PLAYERS} so far.
      </p>

      {players.length > 0 ? (
        <>
          <div className="date-head">Your players</div>
          <div className="stack">
            {players.map((p) => (
              <PlayerRow key={p.id} player={p} />
            ))}
          </div>
        </>
      ) : null}

      <input
        className="search"
        type="search"
        placeholder="Search a player (4+ letters)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search players"
      />
      {q.length >= 4 ? (
        <div className="stack">
          {searching && !results ? <p className="disclaimer">Searching…</p> : null}
          {results?.q === q && results.players.length === 0 && !searching ? <p className="disclaimer">No player matches that.</p> : null}
          {results?.q === q ? results.players.map((p) => <PlayerRow key={p.id} player={p} />) : null}
        </div>
      ) : null}

      {q.length < 4 && clubs.length > 0 ? (
        <>
          <div className="date-head">From your clubs</div>
          <div className="stack">
            {clubs.map((club) => {
              const open = openClub === club.providerId
              const squad = squads[club.providerId] ?? []
              return (
                <div key={club.id} className="squad-block">
                  <button type="button" className="card squad-head" aria-expanded={open} onClick={() => setOpenClub(open ? null : club.providerId)}>
                    <span className="club-name">{club.name}</span>
                    <span className="mono-label">{open ? 'Hide' : 'Squad ›'}</span>
                  </button>
                  {open ? (
                    <div className="stack squad-list">
                      {squad.length === 0 ? <p className="disclaimer">Loading squad…</p> : null}
                      {[...squad]
                        .sort((a, b) => (POSITION_ORDER[a.position ?? ''] ?? 9) - (POSITION_ORDER[b.position ?? ''] ?? 9) || (a.number ?? 99) - (b.number ?? 99))
                        .map((p) => (
                          <PlayerRow key={p.id} player={{ ...p, teamName: club.name, teamProviderId: club.providerId }} showTeam={false} />
                        ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}
