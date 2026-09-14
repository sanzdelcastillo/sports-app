import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { RIGHTS_REVIEWED_ON, RIGHTS_SEASON } from '../data/watch'
import { decodeSetup, encodeSetup } from '../lib/setupCode'
import { DEFAULT_TIME_ZONE } from '../lib/time'
import { useAppState } from '../stores/AppState'

const APP_VERSION = '1.1.0'

export function Settings() {
  const {
    follows,
    subscribed,
    watchLater,
    hideScores,
    toggleHideScores,
    showCrests,
    toggleShowCrests,
    applySetup,
    clearAll,
  } = useAppState()
  const [pasted, setPasted] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const code = useMemo(
    () => encodeSetup({ follows, subscribed, watchLater, hideScores }),
    [follows, subscribed, watchLater, hideScores],
  )

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setNote('Copied. Paste it into Settings on your other phone.')
    } catch {
      setNote('Copy failed — long-press the code to select it.')
    }
  }

  function restore() {
    const setup = decodeSetup(pasted)
    if (!setup) {
      setNote('That code did not work. Check it was copied completely.')
      return
    }
    applySetup(setup)
    setPasted('')
    setNote(`Restored ${setup.follows.length} clubs and ${setup.subscribed.length} apps.`)
  }

  return (
    <div>
      <AppHeader />
      <h1 className="page-title">Settings</h1>

      <div className="date-head">Viewing</div>
      <label className="card option-row">
        <span>
          <strong>Hide scores</strong>
          <span className="option-sub">Live and finished games show no score until you reveal them.</span>
        </span>
        <button type="button" className={`toggle${hideScores ? ' on' : ''}`} aria-pressed={hideScores} onClick={toggleHideScores}>
          {hideScores ? 'On' : 'Off'}
        </button>
      </label>
      <label className="card option-row">
        <span>
          <strong>Club crests and player photos</strong>
          <span className="option-sub">Off shows text badges only.</span>
        </span>
        <button type="button" className={`toggle${showCrests ? ' on' : ''}`} aria-pressed={showCrests} onClick={toggleShowCrests}>
          {showCrests ? 'On' : 'Off'}
        </button>
      </label>
      <p className="source-note">
        Times are shown in your phone's time zone ({DEFAULT_TIME_ZONE}). Where-to-watch covers U.S. services for the{' '}
        {RIGHTS_SEASON} season, reviewed {RIGHTS_REVIEWED_ON}.
      </p>

      <div className="date-head">Your clubs and apps</div>
      <div className="row-gap">
        <Link className="cta secondary wide" to="/clubs">
          Edit clubs ({follows.length})
        </Link>
        <Link className="cta secondary wide" to="/watch">
          Edit apps ({subscribed.length})
        </Link>
      </div>

      <div className="date-head">Move my setup to another phone</div>
      <p className="disclaimer">
        No account needed. Copy this code, open Watch Plan on the other phone, and paste it below there.
      </p>
      <pre className="share-text setup-code" aria-label="Setup code">
        {code}
      </pre>
      <button type="button" className="cta wide" onClick={() => void copyCode()}>
        Copy setup code
      </button>
      <div className="paste-row">
        <input
          className="search"
          type="text"
          placeholder="Paste a code from another phone"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          aria-label="Setup code to restore"
        />
        <button type="button" className="cta secondary" disabled={!pasted.trim()} onClick={restore}>
          Restore
        </button>
      </div>
      {note ? <p className="source-note">{note}</p> : null}

      <div className="date-head">About</div>
      <div className="card about">
        <p>
          <strong>Watch Plan</strong> {APP_VERSION}. The week's games for the clubs you follow, in your time zone,
          with where to watch in the U.S.
        </p>
        <p>
          Everything you set up stays on this phone. There is no account and nothing is sent to us. Fixture, lineup,
          table and broadcast data come from TheSportsDB. Where-to-watch guidance is maintained by hand and can
          lag rights changes — confirm on the provider before kickoff.
        </p>
        <p>
          Watch Plan never streams or embeds video; buttons open the provider. Not affiliated with any league, club or
          broadcaster. Club crests and player images belong to their owners.
        </p>
      </div>

      <div className="date-head">Reset</div>
      {confirmClear ? (
        <div className="row-gap">
          <button type="button" className="cta wide" onClick={clearAll}>
            Yes, erase everything
          </button>
          <button type="button" className="cta secondary wide" onClick={() => setConfirmClear(false)}>
            Keep it
          </button>
        </div>
      ) : (
        <button type="button" className="cta secondary wide" onClick={() => setConfirmClear(true)}>
          Erase my data on this phone
        </button>
      )}
    </div>
  )
}
