import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { TeamCrest } from '../components/TeamCrest'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { MATCH_LENGTH_MS, formatKickoff, overlapMs, parseUtc } from '../lib/time'
import { useAppState } from '../stores/AppState'

interface Conflict {
  a: Fixture
  b: Fixture
  overlapMin: number
}

interface Plan {
  live: Fixture
  later: Fixture
  reason: string
}

/**
 * Suggest which of two overlapping games to watch live.
 * Order of preference: must-watch, then a game you can already reach, then the earlier kickoff.
 * The other game becomes "catch up later" — on the same destination, as a replay where offered.
 */
function planFor(c: Conflict, subscribed: DestinationId[]): Plan {
  const { a, b } = c
  const reach = (f: Fixture) => {
    const s = accessFor(f, subscribed).state
    return s === 'owned' || s === 'free'
  }
  if (Boolean(a.mustWatch) !== Boolean(b.mustWatch)) {
    const live = a.mustWatch ? a : b
    return { live, later: live === a ? b : a, reason: 'Must-watch goes live' }
  }
  if (reach(a) !== reach(b)) {
    const live = reach(a) ? a : b
    return { live, later: live === a ? b : a, reason: 'The one in your apps goes live' }
  }
  return { live: a, later: b, reason: 'Earlier kickoff goes live' }
}

function findConflicts(fixtures: Fixture[]): Conflict[] {
  const upcoming = fixtures.filter((f) => f.status !== 'final')
  const found: Conflict[] = []
  for (let i = 0; i < upcoming.length; i += 1) {
    for (let j = i + 1; j < upcoming.length; j += 1) {
      const a = upcoming[i]
      const b = upcoming[j]
      const a0 = parseUtc(a.kickoffUtc).getTime()
      const b0 = parseUtc(b.kickoffUtc).getTime()
      const overlap = overlapMs(a0, a0 + MATCH_LENGTH_MS, b0, b0 + MATCH_LENGTH_MS)
      if (overlap >= 30 * 60 * 1000) {
        found.push({ a, b, overlapMin: Math.round(overlap / 60000) })
      }
    }
  }
  return found
}

export function Conflicts() {
  const { week, subscribed } = useAppState()
  const conflicts = findConflicts(week.fixtures)

  return (
    <div>
      <AppHeader />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>Conflicts</h1>
      <p className="disclaimer">
        Overlapping kickoffs among followed clubs (30+ minutes). We suggest one to watch live and one to catch up on.
      </p>
      {conflicts.length === 0 ? (
        <EmptyState
          title="No overlaps this week"
          body="When two followed games share a window, they will land here."
        />
      ) : (
        <div className="stack">
          {conflicts.map((c) => {
            const plan = planFor(c, subscribed)
            return (
              <article key={`${c.a.id}-${c.b.id}`} className="card">
                <div className="badges" style={{ marginBottom: 10 }}>
                  <span className="badge warn">Overlap · ~{c.overlapMin} min</span>
                  <span className="badge ghost">{plan.reason}</span>
                </div>
                <ConflictLine fixture={plan.live} role="live" subscribed={subscribed} />
                <ConflictLine fixture={plan.later} role="later" subscribed={subscribed} />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConflictLine({
  fixture,
  role,
  subscribed,
}: {
  fixture: Fixture
  role: 'live' | 'later'
  subscribed: DestinationId[]
}) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  const access = accessFor(fixture, subscribed)
  const where = access.state === 'unknown' ? 'where to watch unknown' : access.destination.shortName
  const hint =
    role === 'live'
      ? `Live on ${where}`
      : access.state === 'unknown'
        ? 'Catch up later'
        : `Catch up later on ${where}`
  return (
    <Link to={`/game/${fixture.id}`} className="conflict-row" style={{ padding: '8px 0' }}>
      <TeamCrest team={home} size="sm" />
      <TeamCrest team={away} size="sm" />
      <div className="meta">
        <h3>
          {home?.shortName} vs {away?.shortName}
        </h3>
        <p>
          {kick.time} · {LEAGUES[fixture.leagueId].shortName}
        </p>
        <span className={`badge ${role === 'live' ? 'plan-live' : 'plan-later'}`}>{hint}</span>
      </div>
    </Link>
  )
}
