import { useEffect, useState } from 'react'
import { getTeam, teamByProviderId } from '../data/teams'
import type { Fixture, Team } from '../domain/types'
import {
  fetchLineup,
  fetchMatchReport,
  fetchTable,
  highlightSearch,
  type MatchEvent,
  type MatchStat,
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
  return table.rows.find((r) => r.teamProviderId === team.providerId)
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
  const ids = new Set([home?.providerId, away?.providerId])
  const focus = table.rows.filter((r) => {
    const near = [homeRow, awayRow].some((x) => x && Math.abs(x.rank - r.rank) <= 1)
    return ids.has(r.teamProviderId) || near || r.rank <= 3
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
              <tr key={r.teamProviderId} className={ids.has(r.teamProviderId) ? 'is-us' : undefined}>
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
        {table.season} season. Source: API-Football. Standings can lag the final whistle by a few hours.
      </p>
    </section>
  )
}

/** Crest for a table row: our catalogue if we know the club, else the feed's tiny badge. */
function TableBadge({ row }: { row: StandingRow }) {
  const known = teamByProviderId(row.teamProviderId)
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

/** The eleven on a pitch: one row per line of the formation, goalkeeper at the bottom, mirrored for the away side. */
function Pitch({ lineup, away, color }: { lineup: TeamLineup; away: boolean; color: string }) {
  const rows = new Map<number, LineupPlayer[]>()
  for (const p of lineup.starters) {
    if (!p.row) return null
    rows.set(p.row, [...(rows.get(p.row) ?? []), p])
  }
  const ordered = [...rows.entries()].sort((a, b) => (away ? a[0] - b[0] : b[0] - a[0]))
  return (
    <div className={`pitch${away ? ' away' : ''}`} aria-hidden="true">
      <div className="pitch-lines">
        <span className="pitch-box" />
        <span className="pitch-arc" />
      </div>
      {ordered.map(([row, players]) => (
        <div key={row} className="pitch-row">
          {players
            .sort((a, b) => (a.col ?? 0) - (b.col ?? 0))
            .map((p) => (
              <span key={p.id} className="pitch-player">
                <span className="pitch-shirt" style={{ background: color }}>
                  {p.number ?? ''}
                </span>
                <span className="pitch-name">{p.name.split(' ').slice(-1)[0]}</span>
              </span>
            ))}
        </div>
      ))}
    </div>
  )
}

function SideLineup({ team, lineup, away }: { team?: Team; lineup: TeamLineup; away: boolean }) {
  const [showBench, setShowBench] = useState(false)
  const [asList, setAsList] = useState(false)
  const canDraw = lineup.starters.length === 11 && lineup.starters.every((p) => p.row)
  return (
    <div className="lineup-side">
      <div className="lineup-head">
        <TeamCrest team={team} size="sm" />
        <div>
          <div className="form-name">{team?.name}</div>
          <div className="form-meta">
            {lineup.shape ? `${lineup.shape}` : lineup.starters.length < 11 ? `Partial — ${lineup.starters.length} of 11 named` : `${lineup.starters.length} named`}
            {lineup.coach ? ` · ${lineup.coach}` : ''}
          </div>
        </div>
        {canDraw ? (
          <button type="button" className="text-btn lineup-view" onClick={() => setAsList((v) => !v)}>
            {asList ? 'Pitch' : 'List'}
          </button>
        ) : null}
      </div>
      {canDraw && !asList ? <Pitch lineup={lineup} away={away} color={team?.color ?? '#17643F'} /> : null}
      {!canDraw || asList ? (
        <ol className="lineup-list">
          {lineup.starters.map((p) => (
            <PlayerLine key={p.id} player={p} />
          ))}
        </ol>
      ) : null}
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
        <SideLineup team={home} lineup={data.home} away={false} />
        <SideLineup team={away} lineup={data.away} away />
      </div>
      <p className="source-note">
        Source: API-Football — lower-tier games may list only part of the eleven. Shape is counted
        from listed positions, not an official formation.
      </p>
    </section>
  )
}

/* ---------- Highlights ---------- */

/** Highlights search for a finished game. Nothing while scores are hidden. */
export function HighlightLink({ fixture }: { fixture: Fixture }) {
  const { hideScores, isSavedForLater } = useAppState()
  const masked = hideScores || isSavedForLater(fixture.id)
  if (fixture.status !== 'final' || masked) return null
  const { url } = highlightSearch(fixture)
  return (
    <a
      className="cta secondary wide highlight-link"
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.preventDefault()
        void openExternal(url)
      }}
    >
      Find highlights on YouTube ↗
    </a>
  )
}

/* ---------- Match: timeline + stats ---------- */

const EVENT_GLYPH: Record<MatchEvent['kind'], string> = {
  goal: '⚽',
  penalty: '⚽',
  'own-goal': '⚽',
  'missed-penalty': '✕',
  yellow: '▮',
  red: '▮',
  sub: '⇄',
  var: 'VAR',
  other: '•',
}

function StatBar({ stat }: { stat: MatchStat }) {
  const total = stat.percent ? 100 : stat.home + stat.away
  const homePct = total > 0 ? Math.round((stat.home / total) * 100) : 50
  const fmt = (n: number) => (stat.percent ? `${n}%` : String(n))
  return (
    <div className="stat-row">
      <span className="stat-val">{fmt(stat.home)}</span>
      <span className="stat-mid">
        <span className="stat-label">{stat.label}</span>
        <span className="stat-track" aria-hidden="true">
          <span className="stat-fill home" style={{ width: `${homePct}%` }} />
          <span className="stat-fill away" style={{ width: `${100 - homePct}%` }} />
        </span>
      </span>
      <span className="stat-val">{fmt(stat.away)}</span>
    </div>
  )
}

/**
 * What happened and how it's going: goals, cards, subs down a centre line, then the stat sheet.
 * Hidden while scores are hidden — every line here is a spoiler.
 */
export function MatchPanel({ fixture }: { fixture: Fixture }) {
  const { hideScores, isSavedForLater } = useAppState()
  const masked = hideScores || isSavedForLater(fixture.id)
  const [load, retry] = useLoad(fixture, masked ? async () => null : fetchMatchReport)
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)

  // Live games: poll the report on the same cadence as scores.
  useEffect(() => {
    if (fixture.status !== 'live' || masked) return
    const id = window.setInterval(retry, 120_000)
    return () => window.clearInterval(id)
  }, [fixture.status, masked, retry])

  if (masked) return <p className="disclaimer">Match events and stats are hidden while scores are hidden.</p>
  if (load.state === 'loading') return <p className="disclaimer">Loading match events…</p>
  if (load.state === 'error' && load.busy) return <Busy retry={retry} />
  if (load.state === 'error' || !load.data) return <p className="disclaimer">Match events are unavailable right now.</p>

  const { events, stats } = load.data
  const nothingYet = events.length === 0 && stats.length === 0

  return (
    <div className="match-panel">
      {nothingYet ? (
        <p className="disclaimer">
          {fixture.status === 'live'
            ? 'No events reported yet. Goals, cards and substitutions appear here as the source logs them.'
            : 'The source has no event-by-event record for this game. Coverage is deepest in the big European leagues.'}
        </p>
      ) : null}

      {events.length > 0 ? (
        <>
          <div className="date-head">Events</div>
          <ol className="timeline" aria-label="Match events">
            {events.map((e, i) => (
              <li key={`${e.minute}-${e.player}-${i}`} className={`tl-row ${e.side} ${e.kind}`}>
                <span className="tl-side">
                  {e.side === 'home' ? (
                    <>
                      <span className="tl-player">{e.player}</span>
                      {e.detail ? <span className="tl-detail">{e.detail}</span> : null}
                    </>
                  ) : null}
                </span>
                <span className="tl-mid">
                  <span className={`tl-glyph ${e.kind}`} aria-label={e.kind}>
                    {EVENT_GLYPH[e.kind]}
                  </span>
                  <span className="tl-minute">{e.minute}'</span>
                </span>
                <span className="tl-side">
                  {e.side === 'away' ? (
                    <>
                      <span className="tl-player">{e.player}</span>
                      {e.detail ? <span className="tl-detail">{e.detail}</span> : null}
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {stats.length > 0 ? (
        <>
          <div className="date-head">Stats</div>
          <div className="stat-heads">
            <span>{home?.shortName ?? 'Home'}</span>
            <span>{away?.shortName ?? 'Away'}</span>
          </div>
          <div className="stats">
            {stats.map((st) => (
              <StatBar key={st.label} stat={st} />
            ))}
          </div>
        </>
      ) : null}
      <p className="source-note">Events and stats from API-Football{fixture.status === 'live' ? ', refreshed every two minutes' : ''}.</p>
    </div>
  )
}
