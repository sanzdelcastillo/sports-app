import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { GameRow } from '../components/GameCard'
import { fixtureById } from '../services/fixtures'
import { useAppState } from '../stores/AppState'

export function Remind() {
  const { reminders, week, toggleReminder, subscribed } = useAppState()
  const fixtures = reminders
    .map((r) => fixtureById(r.fixtureId, week.fixtures))
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

  return (
    <div>
      <AppHeader />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>Remind</h1>
      <p className="disclaimer">Local reminders only. This device will not send push alerts in v1, and nothing is streamed.</p>
      {fixtures.length === 0 ? (
        <EmptyState
          title="No reminders yet"
          body="Open a game and tap the clock to keep it here."
          actionTo="/"
          actionLabel="Browse My Week"
        />
      ) : (
        <div className="stack">
          {fixtures.map((fixture) => (
            <div key={fixture.id}>
              <GameRow fixture={fixture} subscribed={subscribed} />
              <div className="row-gap" style={{ marginTop: 8 }}>
                <Link className="cta" to={`/game/${fixture.id}`}>
                  Open game
                </Link>
                <button type="button" className="cta" onClick={() => toggleReminder(fixture.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
