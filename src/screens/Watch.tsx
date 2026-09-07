import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { JULIO_OWNED_IDS, PROVIDERS, type Provider } from '../data/watch'
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
        Mark services you already use. We prefer those when listing Upcoming / Live / Replay / Unknown destinations.
        Julio’s default map is Apple TV, ESPN+, Peacock, Paramount+, and beIN. No pricing, no checkout, no in-app
        playback.
      </p>
      <div className="date-head">Julio’s default map</div>
      <div className="stack">
        {PROVIDERS.filter((p) => JULIO_OWNED_IDS.includes(p.id)).map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            on={subscribed.includes(provider.id)}
            onToggle={() => toggleSubscription(provider.id)}
          />
        ))}
      </div>
      <div className="date-head">Secondary (optional)</div>
      <div className="stack">
        {PROVIDERS.filter((p) => !JULIO_OWNED_IDS.includes(p.id)).map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            on={subscribed.includes(provider.id)}
            onToggle={() => toggleSubscription(provider.id)}
          />
        ))}
      </div>
      <p className="lock-note">Rights change by region and season. Always confirm on the provider site.</p>
    </div>
  )
}

function ProviderRow({
  provider,
  on,
  onToggle,
}: {
  provider: Provider
  on: boolean
  onToggle: () => void
}) {
  return (
    <article className="card follow-row">
      <div className="meta">
        <h3>{provider.name}</h3>
        <p>{provider.blurb}</p>
      </div>
      <button type="button" className={`toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={onToggle}>
        {on ? 'In your apps' : 'Not in your list'}
      </button>
    </article>
  )
}
