import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { TeamCrest } from '../components/TeamCrest'
import { getTeam } from '../data/teams'
import type { Fixture } from '../domain/types'
import { MATCH_LENGTH_MS, formatKickoff, overlapMs, parseUtc } from '../lib/time'
import { useAppState } from '../stores/AppState'

interface Conflict {
  a: Fixture
  b: Fixture
  overlapMin: number
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
  const { week } = useAppState()
  const conflicts = findConflicts(week.fixtures)

  return (
    <div>
      <AppHeader />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>Conflicts</h1>
      <p className="disclaimer">Overlapping kickoffs among followed clubs (30+ minutes). Pick a destination — we never play both.</p>
      {conflicts.length === 0 ? (
        <EmptyState
          title="No overlaps this week"
          body="When two followed games share a window, they will land here."
        />
      ) : (
        <div className="stack">
          {conflicts.map((c) => (
            <article key={`${c.a.id}-${c.b.id}`} className="card">
              <div className="badge warn" style={{ marginBottom: 10 }}>
                Overlap · ~{c.overlapMin} min
              </div>
              <ConflictLine fixture={c.a} />
              <ConflictLine fixture={c.b} />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ConflictLine({ fixture }: { fixture: Fixture }) {
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const kick = formatKickoff(fixture.kickoffUtc)
  return (
    <Link to={`/game/${fixture.id}`} className="conflict-row" style={{ padding: '8px 0' }}>
      <TeamCrest team={home} size="sm" />
      <TeamCrest team={away} size="sm" />
      <div className="meta">
        <h3>
          {home?.shortName} vs {away?.shortName}
        </h3>
        <p>
          {kick.time} · {fixture.leagueName}
        </p>
      </div>
    </Link>
  )
}
