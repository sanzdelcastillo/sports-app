import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClubPicker } from '../components/ClubPicker'
import { PitchsideMark } from '../components/icons'
import { PROVIDERS } from '../data/watch'
import { useAppState } from '../stores/AppState'

type Step = 'clubs' | 'apps'

export function Welcome() {
  const { follows, subscribed, toggleSubscription, finishOnboarding } = useAppState()
  const [step, setStep] = useState<Step>('clubs')
  const navigate = useNavigate()

  const subs = PROVIDERS.filter((p) => p.kind === 'subscription')

  function done() {
    finishOnboarding()
    navigate('/', { replace: true })
  }

  return (
    <div className="welcome">
      <header className="masthead">
        <span className="wordmark" aria-label="Pitchside">
          <PitchsideMark size={30} />
          <span className="wm-watch">Pitch</span>
          <span className="wm-plan">side</span>
        </span>
        <span className="masthead-sub mono-label">Step {step === 'clubs' ? 1 : 2} of 2</span>
      </header>

      {step === 'clubs' ? (
        <>
          <h1 className="page-title">Who do you follow?</h1>
          <p className="disclaimer">
            Clubs, national teams, or whole competitions under the first tab — pick as many as you like. Your week is built from these:
            every game, in your time zone, with where to watch it in the U.S.
          </p>
          <ClubPicker />
          <div className="welcome-foot">
            <button type="button" className="cta wide" disabled={follows.length === 0} onClick={() => setStep('apps')}>
              {follows.length === 0 ? 'Pick at least one' : `Continue with ${follows.length} follow${follows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="page-title">Which apps do you pay for?</h1>
          <p className="disclaimer">
            Tick what you already have. Every game will say whether it is in your apps, free, or needs something
            else. We can't check your accounts — this is only used to label games.
          </p>
          <div className="stack">
            {subs.map((p) => {
              const on = subscribed.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`card app-row${on ? ' on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggleSubscription(p.id)}
                >
                  <span className="meta">
                    <span className="app-name">{p.name}</span>
                    <span className="app-blurb">{p.blurb}</span>
                  </span>
                  <span className={`toggle${on ? ' on' : ''}`}>{on ? 'Have it' : 'No'}</span>
                </button>
              )
            })}
          </div>
          <div className="welcome-foot">
            <button type="button" className="cta wide" onClick={done}>
              {subscribed.length === 0 ? 'Skip for now — build my week' : 'Build my week'}
            </button>
            <button type="button" className="text-btn welcome-back" onClick={() => setStep('clubs')}>
              Back to clubs
            </button>
          </div>
        </>
      )}
    </div>
  )
}
