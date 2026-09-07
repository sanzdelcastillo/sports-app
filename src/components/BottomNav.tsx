import { NavLink } from 'react-router-dom'
import { AlertIcon, CalendarIcon, ClockIcon, NewsIcon, UserIcon } from './icons'

const ITEMS = [
  { to: '/', label: 'My Week', icon: CalendarIcon, end: true },
  { to: '/news', label: 'News', icon: NewsIcon },
  { to: '/remind', label: 'Remind', icon: ClockIcon },
  { to: '/conflicts', label: 'Conflicts', icon: AlertIcon },
  { to: '/follows', label: 'Follows', icon: UserIcon },
] as const

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <item.icon />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
