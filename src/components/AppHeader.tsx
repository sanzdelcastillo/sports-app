import { GlobeIcon } from './icons'

export function AppHeader({ accent = 'cyan' }: { accent?: 'cyan' | 'orange' }) {
  return (
    <header className="app-header">
      <GlobeIcon className="brand-mark" accent={accent} />
      <div>
        <div className="brand-title">Sports Fan Planner</div>
        <div className="brand-sub">Where to watch · US Eastern · No streaming.</div>
      </div>
    </header>
  )
}
