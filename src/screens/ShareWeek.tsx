import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { buildWeekText } from '../lib/shareWeek'
import { useAppState } from '../stores/AppState'

type CopyState = 'idle' | 'copied' | 'failed'

export function ShareWeek() {
  const { week, subscribed } = useAppState()
  const [includeAccess, setIncludeAccess] = useState(true)
  const [copyState, setCopyState] = useState<CopyState>('idle')

  const text = useMemo(
    () => buildWeekText(week.fixtures, subscribed, { includeAccess }),
    [week.fixtures, subscribed, includeAccess],
  )

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 2000)
  }

  async function share() {
    try {
      await navigator.share({ title: "This week's games", text })
    } catch {
      /* user cancelled or share unavailable — nothing to do */
    }
  }

  return (
    <div>
      <AppHeader />
      <Link className="back" to="/">
        ← My Week
      </Link>
      <h1 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.03em' }}>Share my week</h1>
      <p className="disclaimer">
        Plain text, ready to paste into a text or email. Kickoffs in U.S. Eastern with where to watch.
      </p>

      <label className="card option-row">
        <span>
          <strong>Show which games are in my apps</strong>
          <span className="option-sub">Turn off when sending to someone with different services.</span>
        </span>
        <button
          type="button"
          className={`toggle${includeAccess ? ' on' : ''}`}
          aria-pressed={includeAccess}
          onClick={() => setIncludeAccess((v) => !v)}
        >
          {includeAccess ? 'On' : 'Off'}
        </button>
      </label>

      <div className="row-gap" style={{ margin: '2px 0 12px' }}>
        <button type="button" className="cta glass-pill wide" onClick={() => void copy()}>
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed — select the text' : 'Copy text'}
        </button>
        {canShare ? (
          <button type="button" className="cta glass-pill wide" onClick={() => void share()}>
            Share…
          </button>
        ) : null}
      </div>

      <pre className="share-text" aria-label="Week as text">
        {text}
      </pre>

      <p className="lock-note">Built from your followed clubs. No scores are included, so it is safe to send.</p>
    </div>
  )
}
