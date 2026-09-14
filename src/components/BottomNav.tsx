import { NavLink } from 'react-router-dom'
import { AlertIcon, CalendarIcon, GearIcon, TvIcon, UserIcon } from './icons'

const ITEMS = [
  { to: '/', label: 'My Week', icon: CalendarIcon, end: true },
  { to: '/conflicts', label: 'Conflicts', icon: AlertIcon },
  { to: '/clubs', label: 'Clubs', icon: UserIcon },
  { to: '/watch', label: 'Apps', icon: TvIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
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
