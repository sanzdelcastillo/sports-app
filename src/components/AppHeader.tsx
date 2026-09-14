import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="masthead">
      <Link to="/" className="wordmark" aria-label="Watch Plan home">
        <span className="wm-watch">Watch</span>
        <span className="wm-plan">Plan</span>
      </Link>
      <span className="masthead-sub mono-label">Never streams video</span>
    </header>
  )
}
