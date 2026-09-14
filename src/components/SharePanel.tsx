import { useEffect, useState } from 'react'
import { getTeam } from '../data/teams'
import type { Fixture } from '../domain/types'
import { gameShareText, gameShareUrl, renderGameCard } from '../lib/shareGame'
import { shareGame } from '../native/external'
import { useAppState } from '../stores/AppState'

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" className="stepper-btn" aria-label={`${label} minus one`} onClick={() => onChange(Math.max(0, value - 1))}>
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button type="button" className="stepper-btn" aria-label={`${label} plus one`} onClick={() => onChange(Math.min(15, value + 1))}>
          +
        </button>
      </div>
    </div>
  )
}

/**
 * Share this game: your score call plus a card into WhatsApp / iMessage.
 * The link opens the game in the friend's own time zone, no account needed.
 */
export function SharePanel({ fixture }: { fixture: Fixture }) {
  const { subscribed, predictions, setPrediction } = useAppState()
  const home = getTeam(fixture.homeTeamId)
  const away = getTeam(fixture.awayTeamId)
  const saved = predictions[fixture.id] ?? null
  const [draft, setDraft] = useState(saved ?? { home: 0, away: 0 })
  const [calling, setCalling] = useState(Boolean(saved))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const canCall = fixture.status === 'scheduled'

  // Live preview of the card, so what you send is what you saw.
  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    renderGameCard(fixture, subscribed, calling ? (saved ?? draft) : null)
      .then((blob) => {
        if (cancelled || !blob) return
        url = URL.createObjectURL(blob)
        setPreview(url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [fixture, subscribed, calling, saved, draft])

  function keepCall() {
    setPrediction(fixture.id, draft)
    setNote(`Locked: ${home?.shortName} ${draft.home}–${draft.away} ${away?.shortName}.`)
  }

  async function share() {
    setBusy(true)
    setNote(null)
    const prediction = calling ? (saved ?? draft) : null
    if (calling && !saved) setPrediction(fixture.id, draft)
    const text = gameShareText(fixture, subscribed, prediction)
    let image: Blob | null = null
    try {
      image = await renderGameCard(fixture, subscribed, prediction)
    } catch {
      image = null
    }
    const result = await shareGame({
      title: `${home?.name ?? 'Home'} vs ${away?.name ?? 'Away'}`,
      text,
      url: gameShareUrl(fixture),
      image,
      filename: `pitchside-${home?.shortName ?? 'home'}-${away?.shortName ?? 'away'}.png`.toLowerCase(),
    })
    setBusy(false)
    if (result === 'copied') setNote('Copied to your clipboard — paste it into any chat.')
    else if (result === 'failed') setNote('Sharing was cancelled.')
  }

  return (
    <section className="card share-panel">
      <h2 className="display-head">Share this game</h2>
      <p className="disclaimer">
        Sends a card with kickoff, where to watch and your call to any chat. The link shows the game in your friend's
        time zone, no app needed.
      </p>

      {canCall ? (
        <div className="call-block">
          <label className="option-row inline">
            <span>
              <strong>Add my call</strong>
              <span className="option-sub">Your score prediction, kept on this phone.</span>
            </span>
            <button type="button" className={`toggle${calling ? ' on' : ''}`} aria-pressed={calling} onClick={() => setCalling((v) => !v)}>
              {calling ? 'On' : 'Off'}
            </button>
          </label>
          {calling ? (
            <div className="steppers">
              <Stepper label={home?.shortName ?? 'Home'} value={draft.home} onChange={(n) => setDraft({ ...draft, home: n })} />
              <span className="stepper-dash">–</span>
              <Stepper label={away?.shortName ?? 'Away'} value={draft.away} onChange={(n) => setDraft({ ...draft, away: n })} />
              <button type="button" className="cta secondary" onClick={keepCall}>
                {saved ? 'Update' : 'Lock it'}
              </button>
            </div>
          ) : null}
        </div>
      ) : saved ? (
        <p className="source-note">
          Your call was {home?.shortName} {saved.home}–{saved.away} {away?.shortName}.
        </p>
      ) : null}

      {preview ? <img className="share-preview" src={preview} alt="Preview of the card you will share" /> : null}
      <button type="button" className="cta wide" disabled={busy} onClick={() => void share()}>
        {busy ? 'Preparing…' : 'Share'}
      </button>
      {note ? <p className="source-note">{note}</p> : null}
    </section>
  )
}
