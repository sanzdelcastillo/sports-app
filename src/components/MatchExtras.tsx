import { useEffect, useState } from 'react'
import { getTeam, teamBySportsDb } from '../data/teams'
import type { Fixture, Team } from '../domain/types'
import {
  fetchHighlight,
  fetchLineup,
  fetchTable,
  fetchTvListings,
  type LeagueTable,
  type LineupPlayer,
  type MatchLineup,
  type StandingRow,
  type TeamLineup,
} from '../services/matchExtras'
import { openExternal } from '../native/external'
import { useAppState } from '../stores/AppState'
import { TeamCrest } from './TeamCrest'

type Load<T> = { state: 'loading' } | { state: 'ready'; data: T | null } | { state: 'error'; busy: boolean }

function useLoad<T>(fixture: Fixture, loader: (f: Fixture) => Promise<T | null>): [Load<T>, () => void] {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; load: Load<T> } | null>(null)
  useEffect(() => {
    let cancelled = false
    const key = `${fixture.id}:${attempt}`
    loader(fixture)
      .then((data) => {
        if (!cancelled) setResult({ key, load: { state: 'ready', data } })
      })
      .catch((error: unknown) => {
        const busy = error instanceof Error && error.name === 'RateLimited'
        if (!cancelled) setResult({ key, load: { state: 'error', busy } })
      })
    return () => {
      cancelled = true
    }
  }, [fixture, loader, attempt])
  const load: Load<T> = result && result.key === `${fixture.id}:${attempt}` ? result.load : { state: 'loading' }
  return [load, () => setAttempt((n) => n + 1)]
}

function Busy({ retry }: { retry: () => void }) {
  return (
    <p className="disclaimer">
      The data source is busy right now.{' '}
      <button type="button" className="text-btn" onClick={retry}>
        Try again
      </button>
    </p>
  )
}

/* ---------- Form ---------- */

export function FormDots({ form, label }: { form: string; label?: string }) {
  if (!form) return null
  const last = form.slice(-5)
  return (
    <span className="form-dots" aria-label={`${label ? `${label} form: ` : 'Form: '}${last.split('').join(', ')}`}>
      {last.split('').map((r, i) => (
        <span key={i} className={`form-dot ${r}`} aria-hidden="true">
          {r}
        </span>
      ))}
    </span>
  )
}

/* ---------- Table ---------- */

function rowFor(table: LeagueTable | null, team?: Team): StandingRow | undefined {
  if (!table || !team) return undefined
  return table.rows.find((r) => r.teamSportsDbId === team.sportsDbId)
}

export function TablePanel({ fixture }: { fixture: Fixture }) {
  const [load, retry] = useLoad(fixture, fetchTable)
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)

  if (load.state === 'loading') return <p className="disclaimer">Loading the table…</p>
  if (load.state === 'error' && load.busy) return <Busy retry={retry} />
  if (load.state === 'error' || !load.data) {
    return <p className="disclaimer">No table for this competition yet. Cup and league-phase tables arrive once they exist at the source.</p>
  }
  const table = load.data
  const homeRow = rowFor(table, home)
  const awayRow = rowFor(table, away)
  const ids = new Set([home?.sportsDbId, away?.sportsDbId])
  const focus = table.rows.filter((r) => {
    const near = [homeRow, awayRow].some((x) => x && Math.abs(x.rank - r.rank) <= 1)
    return ids.has(r.teamSportsDbId) || near || r.rank <= 3
  })

  return (
    <section>
      <div className="form-row">
        {[home, away].map((team, i) => {
          const row = i === 0 ? homeRow : awayRow
          return (
            <div key={team?.id ?? i} className="form-team">
              <TeamCrest team={team} size="sm" />
              <div>
                <div className="form-name">{team?.shortName}</div>
                {row ? (
                  <div className="form-meta">
                    {ordinal(row.rank)} — {row.points} pts — {row.played} played
                  </div>
                ) : (
                  <div className="form-meta">Not in this table</div>
                )}
                {row ? <FormDots form={row.form} label={team?.name} /> : null}
              </div>
            </div>
          )
        })}
      </div>
      <table className="standings" aria-label={`${table.season} table`}>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col" className="left">
              Club
            </th>
            <th scope="col">P</th>
            <th scope="col">GD</th>
            <th scope="col">Pts</th>
          </tr>
        </thead>
        <tbody>
          {focus.map((r, i) => {
            const gap = i > 0 && r.rank - focus[i - 1].rank > 1
            return (
              <tr key={r.teamSportsDbId} className={ids.has(r.teamSportsDbId) ? 'is-us' : undefined}>
                <td className={gap ? 'gap' : undefined}>{r.rank}</td>
                <td className="left">
                  <span className="club-cell">
                    <TableBadge row={r} />
                    {r.team}
                  </span>
                </td>
                <td>{r.played}</td>
                <td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                <td className="pts">{r.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="source-note">
        {table.season} season. Source: TheSportsDB. Standings can lag the final whistle by a few hours.
      </p>
    </section>
  )
}

/** Crest for a table row: our catalogue if we know the club, else the feed's tiny badge. */
function TableBadge({ row }: { row: StandingRow }) {
  const known = teamBySportsDb(row.teamSportsDbId)
  const src = known?.espnLogoUrl ?? known?.badgeUrl ?? row.badgeUrl
  if (!src) return <span className="table-badge empty" aria-hidden="true" />
  return <img className="table-badge" src={src} alt="" loading="lazy" width={20} height={20} />
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

/* ---------- Lineups ---------- */

function PlayerPhoto({ player }: { player: LineupPlayer }) {
  const { showCrests } = useAppState()
  const [failed, setFailed] = useState(false)
  if (!showCrests || !player.cutoutUrl || failed) {
    return (
      <span className="player-photo fallback" aria-hidden="true">
        {player.number ?? '·'}
      </span>
    )
  }
  return (
    <img
      className="player-photo"
      src={player.cutoutUrl}
      alt=""
      loading="lazy"
      width={30}
      height={30}
      onError={() => setFailed(true)}
    />
  )
}

function PlayerLine({ player }: { player: LineupPlayer }) {
  return (
    <li className="player">
      <PlayerPhoto player={player} />
      <span className="player-num">{player.number ?? '–'}</span>
      <span className="player-name">{player.name}</span>
      <span className="player-slot">{player.slot === 'SUB' ? '' : player.slot}</span>
    </li>
  )
}

function SideLineup({ team, lineup }: { team?: Team; lineup: TeamLineup }) {
  const [showBench, setShowBench] = useState(false)
  return (
    <div className="lineup-side">
      <div className="lineup-head">
        <TeamCrest team={team} size="sm" />
        <div>
          <div className="form-name">{team?.name}</div>
          <div className="form-meta">
            {lineup.shape
              ? `Shape ${lineup.shape}`
              : lineup.starters.length < 11
                ? `Partial — ${lineup.starters.length} of 11 named`
                : `${lineup.starters.length} named`}
          </div>
        </div>
      </div>
      <ol className="lineup-list">
        {lineup.starters.map((p) => (
          <PlayerLine key={p.id} player={p} />
        ))}
      </ol>
      {lineup.bench.length > 0 ? (
        <>
          <button type="button" className="text-btn bench-toggle" onClick={() => setShowBench((v) => !v)} aria-expanded={showBench}>
            {showBench ? 'Hide bench' : `Bench (${lineup.bench.length})`}
          </button>
          {showBench ? (
            <ol className="lineup-list bench">
              {lineup.bench.map((p) => (
                <PlayerLine key={p.id} player={p} />
              ))}
            </ol>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function LineupsPanel({ fixture }: { fixture: Fixture }) {
  const [load, retry] = useLoad(fixture, fetchLineup)
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)

  if (load.state === 'loading') return <p className="disclaimer">Checking for lineups…</p>
  if (load.state === 'error' && load.busy) return <Busy retry={retry} />
  if (load.state === 'error' || !load.data) {
    return (
      <p className="disclaimer">
        {fixture.status === 'scheduled'
          ? 'Not announced yet. Lineups usually appear about an hour before kickoff.'
          : 'Lineups unavailable for this game at the source.'}
      </p>
    )
  }
  const data: MatchLineup = load.data
  return (
    <section>
      <div className="lineup-grid">
        <SideLineup team={home} lineup={data.home} />
        <SideLineup team={away} lineup={data.away} />
      </div>
      <p className="source-note">
        Source: TheSportsDB, a community-maintained feed — some games list only part of the eleven. Shape is counted
        from listed positions, not an official formation.
      </p>
    </section>
  )
}

/* ---------- U.S. TV listings ---------- */

export function TvListingsPanel({ fixture }: { fixture: Fixture }) {
  const [load, retry] = useLoad(fixture, fetchTvListings)

  if (load.state === 'loading') return <p className="disclaimer">Checking broadcast listings…</p>
  if (load.state === 'error' && load.busy) return <Busy retry={retry} />
  if (load.state === 'error' || !load.data || load.data.us.length === 0) {
    return (
      <p className="disclaimer">
        No U.S. broadcast listed at the source yet. The destinations above are your best guide.
      </p>
    )
  }
  return (
    <ul className="tv-list" aria-label="U.S. TV listings">
      {load.data.us.map((l) => (
        <li key={l.channel} className="tv-row">
          {l.logoUrl ? <img className="tv-logo" src={l.logoUrl} alt="" loading="lazy" width={28} height={28} /> : <span className="tv-logo empty" aria-hidden="true" />}
          <span className="tv-channel">{l.channel}</span>
          {l.language === 'es' ? <span className="badge ghost">Español</span> : null}
        </li>
      ))}
    </ul>
  )
}

/* ---------- Highlights ---------- */

/** Link to the game's official highlights. Renders nothing until the game is over, or while scores are hidden. */
export function HighlightLink({ fixture }: { fixture: Fixture }) {
  const { hideScores, isSavedForLater } = useAppState()
  const masked = hideScores || isSavedForLater(fixture.id)
  const enabled = fixture.status === 'final' && !masked
  const [load] = useLoad(fixture, enabled ? fetchHighlight : async () => null)
  if (!enabled || load.state !== 'ready' || !load.data) return null
  return (
    <a
      className="cta secondary wide highlight-link"
      href={load.data.url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault()
        void openExternal(load.data!.url)
      }}
    >
      Watch highlights on YouTube ↗
    </a>
  )
}
