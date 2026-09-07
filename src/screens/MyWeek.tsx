import { useMemo } from 'react'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { FeaturedGame, GameRow } from '../components/GameCard'
import { formatKickoff } from '../lib/time'
import { useAppState } from '../stores/AppState'

export function MyWeek() {
  const { follows, week, loading, refresh, subscribed } = useAppState()

  const { featured, groups } = useMemo(() => {
    const upcoming = week.fixtures.filter((f) => f.status !== 'final')
    const featuredGame =
      upcoming.find((f) => f.status === 'live') ?? upcoming[0] ?? week.fixtures[0]
    const rest = week.fixtures.filter((f) => f.id !== featuredGame?.id)
    const map = new Map<string, typeof rest>()
    for (const fixture of rest) {
      const key = formatKickoff(fixture.kickoffUtc).day
      const list = map.get(key) ?? []
      list.push(fixture)
      map.set(key, list)
    }
    return { featured: featuredGame, groups: [...map.entries()] }
  }, [week.fixtures])

  const sourceLabel =
    week.source === 'live'
      ? 'TheSportsDB (near-live)'
      : week.source === 'mixed'
        ? 'TheSportsDB + seed (favorites-complete)'
        : 'Seeded fixtures (offline-safe)'

  return (
    <div>
      <AppHeader />
      <section className="hero" aria-label="My Week">
        <div className="kicker">Stadium night</div>
        <h1>My Week</h1>
        <span className="pill">Live • ~7 days ET</span>
        <div className="hero-meta">
          {follows.length} followed teams • {sourceLabel} •{' '}
          <button className="text-btn" type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </section>

      {loading && week.fixtures.length === 0 ? (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      ) : null}

      {week.error ? <p className="source-note">{week.error}</p> : null}

      {follows.length === 0 ? (
        <EmptyState
          title="Follow clubs to fill your week"
          body="My Week only lists games for teams you follow. Seed Julio’s 11 from Follows."
          actionTo="/follows"
          actionLabel="Choose follows"
        />
      ) : week.fixtures.length === 0 ? (
        <EmptyState
          title="No followed-team fixtures in this window"
          body="Nothing live or upcoming for your clubs in the next ~7 days. Try Refresh, or add another club."
          actionTo="/follows"
          actionLabel="Manage follows"
        />
      ) : (
        <>
          <div className="section-label">Next up</div>
          {featured ? <FeaturedGame fixture={featured} subscribed={subscribed} /> : null}
          {groups.map(([day, fixtures]) => (
            <section key={day}>
              <div className="date-head">{day}</div>
              {fixtures.map((fixture) => (
                <GameRow key={fixture.id} fixture={fixture} />
              ))}
            </section>
          ))}
        </>
      )}

      <p className="lock-note">This app never streams or embeds live video. Destinations open the provider.</p>
    </div>
  )
}
