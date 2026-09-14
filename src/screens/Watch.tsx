import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PROVIDERS, RIGHTS_REVIEWED_ON, RIGHTS_SEASON, type Provider } from '../data/watch'
import { useAppState } from '../stores/AppState'

const reviewedLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
  new Date(`${RIGHTS_REVIEWED_ON}T12:00:00Z`),
)

export function Watch() {
  const { subscribed, toggleSubscription } = useAppState()
  const subs = PROVIDERS.filter((p) => p.kind === 'subscription')
  const free = PROVIDERS.filter((p) => p.kind === 'free')
  const linear = PROVIDERS.filter((p) => p.kind === 'linear')

  return (
    <div>
      <AppHeader />
      <Link className="back" to="/">
        ← My Week
      </Link>
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>My apps</h1>
      <p className="disclaimer">
        Tick the services you already pay for. Every game then shows whether it is in your apps, free, or needs
        something you don’t have. We only use this to label games — we can’t check your account.
      </p>
      <div className="date-head">Subscriptions</div>
      <div className="stack">
        {subs.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            on={subscribed.includes(provider.id)}
            onToggle={() => toggleSubscription(provider.id)}
          />
        ))}
      </div>
      <div className="date-head">Free — no account needed</div>
      <div className="stack">
        {free.map((provider) => (
          <ProviderRow key={provider.id} provider={provider} on={true} locked />
        ))}
      </div>
      <div className="date-head">TV channels</div>
      <div className="stack">
        {linear.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            on={subscribed.includes(provider.id)}
            onToggle={() => toggleSubscription(provider.id)}
          />
        ))}
      </div>
      <p className="lock-note">
        U.S. rights map for {RIGHTS_SEASON}, reviewed {reviewedLabel}. Rights move between seasons — confirm on the
        provider before kickoff.
      </p>
    </div>
  )
}

function ProviderRow({
  provider,
  on,
  onToggle,
  locked = false,
}: {
  provider: Provider
  on: boolean
  onToggle?: () => void
  locked?: boolean
}) {
  return (
    <article className="card follow-row">
      <div className="meta">
        <h3>{provider.name}</h3>
        <p>{provider.blurb}</p>
      </div>
      {locked ? (
        <span className="badge access-free">Always free</span>
      ) : (
        <button type="button" className={`toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={onToggle}>
          {on ? 'In your apps' : 'Not in your list'}
        </button>
      )}
    </article>
  )
}
