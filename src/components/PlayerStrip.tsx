import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPlayerSeason, totals, type PlayerSeason } from '../services/players'
import { useAppState } from '../stores/AppState'
import { PlayerFace } from './PlayerFace'

/** Your players at a glance: goals and assists this season, tap for the page. */
export function PlayerStrip() {
  const { players } = useAppState()
  const [seasons, setSeasons] = useState<Record<string, PlayerSeason | null>>({})

  useEffect(() => {
    let cancelled = false
    const missing = players.filter((p) => !(p.id in seasons))
    if (!missing.length) return
    void Promise.all(missing.map((p) => fetchPlayerSeason(p.id).catch(() => null))).then((results) => {
      if (cancelled) return
      setSeasons((prev) => {
        const out = { ...prev }
        missing.forEach((p, i) => (out[p.id] = results[i]))
        return out
      })
    })
    return () => {
      cancelled = true
    }
  }, [players, seasons])

  if (players.length === 0) return null
  return (
    <section aria-label="Your players">
      <div className="date-head">Your players</div>
      <div className="club-strip" role="list">
        {players.map((p) => {
          const season = seasons[p.id]
          const t = season ? totals(season.rows, true) : null
          const injured = season?.player.injured
          return (
            <Link key={p.id} to={`/player/${p.id}`} className={`club-tile player-tile${injured ? ' injured' : ''}`} role="listitem">
              <PlayerFace player={season?.player ?? p} size="sm" />
              <span className="club-abbr">{p.name.split(' ').slice(-1)[0]}</span>
              <span className="club-when">{t ? `${t.goals}G · ${t.assists}A${t.rating ? ` · ${t.rating}` : ''}` : season === null ? 'No numbers yet' : '…'}</span>
              {injured ? <span className="player-injured-dot" aria-label="Injured" /> : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
