import { Link } from 'react-router-dom'
import { PitchsideMark } from './icons'

export function AppHeader() {
  return (
    <header className="masthead">
      <Link to="/" className="wordmark" aria-label="Pitchside home">
        <PitchsideMark size={30} />
        <span className="wm-watch">Pitch</span>
        <span className="wm-plan">side</span>
      </Link>
    </header>
  )
}
