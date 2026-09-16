import { Link, NavLink } from 'react-router-dom'
import { CalendarIcon, GearIcon, NewsIcon, PitchsideMark, TvIcon, UserIcon } from './icons'

const ITEMS = [
  { to: '/', label: 'My Week', icon: CalendarIcon, end: true },
  { to: '/news', label: 'News', icon: NewsIcon },
  { to: '/clubs', label: 'Following', icon: UserIcon },
  { to: '/watch', label: 'Apps', icon: TvIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
] as const

export function AppHeader() {
  return (
    <header className="masthead">
      <Link to="/" className="wordmark" aria-label="Pitchside home">
        <PitchsideMark size={30} />
        <span className="wm-watch">Pitch</span>
        <span className="wm-plan">side</span>
      </Link>
      {/* Wide screens only (CSS); phones keep the thumb bar. */}
      <nav className="top-nav" aria-label="Primary">
        {ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `top-nav-item${isActive ? ' active' : ''}`} {...rest}>
            <Icon width={16} height={16} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
