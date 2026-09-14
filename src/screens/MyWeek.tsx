import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { FeaturedGame, featuredKicker, GameCardSkeleton, GameRow } from '../components/GameCard'
import { getTeam } from '../data/teams'
import { coverageFor } from '../data/watch'
import type { FixtureChange } from '../domain/types'
import { formatKickoff } from '../lib/time'
import { fixtureById } from '../services/fixtures'
import { useAppState } from '../stores/AppState'

function coverageLine(c: ReturnType<typeof coverageFor>): string {
  if (c.total === 0) return ''
  const reachable = c.owned + c.free
  const parts = [`${reachable} of ${c.total} upcoming in your apps or free`]
  if (c.gaps.length) {
    parts.push(c.gaps.map((g) => `${g.games} need${g.games === 1 ? 's' : ''} ${g.shortName}`).join(', '))
  }
  if (c.unknown) parts.push(`${c.unknown} unknown`)
  return parts.join(' · ')
}

function changeSentence(change: FixtureChange, fixtures: ReturnType<typeof useAppState>['week']['fixtures']): string | null {
  const fixture = fixtureById(change.fixtureId, fixtures)
  if (!fixture) return null
  const home = getTeam(fixture.homeTeamId)?.shortName ?? fixture.homeTeamId
  const away = getTeam(fixture.awayTeamId)?.shortName ?? fixture.awayTeamId
  const matchup = `${home} vs ${away}`
  if (change.kind === 'postponed') return `${matchup} is postponed`
  if (change.from && change.to) {
    const was = formatKickoff(change.from)
    const now = formatKickoff(change.to)
    const sameDay = was.dateKey === now.dateKey
    return sameDay
      ? `${matchup} moved to ${now.time} (was ${was.time})`
      : `${matchup} moved to ${now.day} ${now.time} (was ${was.day} ${was.time})`
  }
  return `${matchup} changed`
}

export function MyWeek() {
  const {
    follows,
    week,
    loading,
    refresh,
    subscribed,
    hideScores,
    toggleHideScores,
    changes,
    dismissChanges,
    watchLater,
    markWatched,
  } = useAppState()

  const { featured, upcomingGroups, recentGroups } = useMemo(() => {
    const upcoming = week.fixtures.filter((f) => f.status !== 'final')
    const recent = week.fixtures.filter((f) => f.status === 'final')
    const featuredGame =
      upcoming.find((f) => f.status === 'live') ?? upcoming[0] ?? week.fixtures[0]
    const upcomingRest = upcoming.filter((f) => f.id !== featuredGame?.id)

    const groupByDay = (fixtures: typeof upcoming) => {
      const map = new Map<string, typeof fixtures>()
      for (const fixture of fixtures) {
        const key = formatKickoff(fixture.kickoffUtc).day
        const list = map.get(key) ?? []
        list.push(fixture)
        map.set(key, list)
      }
      return [...map.entries()]
    }

    return {
      featured: featuredGame,
      upcomingGroups: groupByDay(upcomingRest),
      recentGroups: groupByDay(recent),
    }
  }, [week.fixtures])

  const coverage = useMemo(
    () => coverageFor(week.fixtures.filter((f) => f.status !== 'final'), subscribed),
    [week.fixtures, subscribed],
  )

  const changeLines = useMemo(
    () => changes.map((c) => changeSentence(c, week.fixtures)).filter((line): line is string => Boolean(line)),
    [changes, week.fixtures],
  )

  const laterFixtures = useMemo(
    () =>
      watchLater
        .map((id) => fixtureById(id, week.fixtures))
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)),
    [watchLater, week.fixtures],
  )

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
        <div className="hero-top">
          <div>
            <div className="kicker">Stadium night</div>
            <h1>My Week</h1>
          </div>
          <button
            type="button"
            className="pill pill-btn"
            aria-pressed={hideScores}
            onClick={toggleHideScores}
            title="Hide scores for live and finished games"
          >
            {hideScores ? 'Scores hidden' : 'Scores shown'}
          </button>
        </div>
        {coverage.total > 0 ? <div className="hero-coverage">{coverageLine(coverage)}</div> : null}
        <div className="hero-meta">
          {follows.length} followed teams · {sourceLabel} ·{' '}
          <button className="text-btn" type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {week.fixtures.length > 0 ? (
          <div className="hero-actions">
            <Link className="pill" to="/share">
              Share my week
            </Link>
            <Link className="pill" to="/watch">
              My apps
            </Link>
          </div>
        ) : null}
      </section>

      {changeLines.length > 0 ? (
        <section className="card changes-strip" aria-label="Schedule changes since your last visit">
          <div className="changes-head">
            <strong>Since your last visit</strong>
            <button type="button" className="text-btn" onClick={dismissChanges}>
              Got it
            </button>
          </div>
          <ul className="changes-list">
            {changeLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {laterFixtures.length > 0 ? (
        <section aria-label="Catch up later">
          <div className="section-label">Catch up later · scores hidden</div>
          {laterFixtures.map((fixture) => (
            <div key={`later-${fixture.id}`} className="later-item">
              <GameRow fixture={fixture} subscribed={subscribed} />
              <button type="button" className="cta glass-pill compact later-done" onClick={() => markWatched(fixture.id)}>
                Watched — show score
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {follows.length === 0 ? (
        <EmptyState
          title="Follow clubs to fill your week"
          body="My Week only lists games for teams you follow. Seed Julio’s 11 from Follows."
          actionTo="/follows"
          actionLabel="Go to Follows"
        />
      ) : loading && week.fixtures.length === 0 ? (
        <div className="stack" aria-busy="true" aria-label="Loading this week">
          <GameCardSkeleton />
          <GameCardSkeleton />
          <GameCardSkeleton />
        </div>
      ) : (
        <>
          {week.error ? <p className="source-note">{week.error}</p> : null}
          {week.fixtures.length === 0 ? (
            <EmptyState
              title="No followed-team fixtures in this window"
              body="Nothing live or upcoming for your clubs in the next ~7 days. Try Refresh, or add another club."
              actionTo="/follows"
              actionLabel="Go to Follows"
            />
          ) : (
            <>
              {featured ? (
                <>
                  <div className="section-label">{featuredKicker(featured)}</div>
                  <FeaturedGame fixture={featured} subscribed={subscribed} />
                </>
              ) : null}
              {upcomingGroups.map(([day, fixtures]) => (
                <section key={`up-${day}`}>
                  <div className="date-head">{day}</div>
                  {fixtures.map((fixture) => (
                    <GameRow key={fixture.id} fixture={fixture} subscribed={subscribed} />
                  ))}
                </section>
              ))}
              {recentGroups.length > 0 ? (
                <>
                  <div className="section-label" style={{ marginTop: 22 }}>
                    Earlier this week
                  </div>
                  {recentGroups.map(([day, fixtures]) => (
                    <section key={`re-${day}`}>
                      <div className="date-head">{day}</div>
                      {fixtures.map((fixture) => (
                        <GameRow key={fixture.id} fixture={fixture} subscribed={subscribed} />
                      ))}
                    </section>
                  ))}
                </>
              ) : null}
            </>
          )}
        </>
      )}

      <p className="lock-note">This app never streams or embeds live video. Destinations open the provider.</p>
    </div>
  )
}
