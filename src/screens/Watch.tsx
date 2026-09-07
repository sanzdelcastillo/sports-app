import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PROVIDERS } from '../data/watch'
import { useAppState } from '../stores/AppState'

export function Watch() {
  const { subscribed, toggleSubscription } = useAppState()

  return (
    <div>
      <AppHeader />
      <Link className="back" to="/follows">
        ← Follows
      </Link>
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>Watch destinations</h1>
      <p className="disclaimer">
        Mark services you already subscribe to. We prefer those when listing Live / Replay / Unknown destinations. No
        pricing, no checkout, no in-app playback.
      </p>
      <div className="stack">
        {PROVIDERS.map((provider) => {
          const on = subscribed.includes(provider.id)
          return (
            <article key={provider.id} className="card follow-row">
              <div className="meta">
                <h3>{provider.name}</h3>
                <p>{provider.blurb}</p>
              </div>
              <button
                type="button"
                className={`toggle${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleSubscription(provider.id)}
              >
                {on ? 'Subscribed' : 'I have this'}
              </button>
            </article>
          )
        })}
      </div>
      <p className="lock-note">Rights change by region and season. Always confirm on the provider site.</p>
    </div>
  )
}
