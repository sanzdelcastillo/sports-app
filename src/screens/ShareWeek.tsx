import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { buildIcs, downloadIcs } from '../lib/ics'
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

      <h2 style={{ margin: '20px 0 6px', fontSize: 18 }}>Or add the whole week to a calendar</h2>
      <p className="disclaimer">
        One file with every upcoming game. Open it on your phone or computer and your calendar imports them all. Each
        game keeps a stable ID, so importing again after a schedule change updates events rather than duplicating them.
      </p>
      <button
        type="button"
        className="cta glass-pill wide"
        onClick={() =>
          downloadIcs(
            'my-week',
            buildIcs(
              week.fixtures.filter((f) => f.status !== 'final'),
              subscribed,
              'My Week',
            ),
          )
        }
      >
        Download calendar file
      </button>

      <p className="lock-note">Built from your followed clubs. No scores are included, so it is safe to send.</p>
    </div>
  )
}
