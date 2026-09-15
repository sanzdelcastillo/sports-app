import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { ClubStrip } from '../components/ClubStrip'
import { EmptyState } from '../components/EmptyState'
import { FeaturedGame, GameCardSkeleton, GameRow } from '../components/GameCard'
import { TablesView } from '../components/MatchExtras'
import { getTeam } from '../data/teams'
import { coverageFor } from '../data/watch'
import type { FixtureChange } from '../domain/types'
import { findConflicts } from '../lib/conflicts'
import { formatKickoff, relativeLabel, RESULTS_DAYS } from '../lib/time'
import { fixtureById } from '../services/fixtures'
import { useAppState } from '../stores/AppState'

function gapsLine(c: ReturnType<typeof coverageFor>): string | null {
  const parts: string[] = []
  if (c.gaps.length) {
    parts.push(c.gaps.map((g) => `${g.games} need${g.games === 1 ? 's' : ''} ${g.shortName}`).join(', '))
  }
  if (c.unknown) parts.push(`${c.unknown} with no confirmed listing`)
  return parts.length ? parts.join('. ') + '.' : null
}

function savedAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  return mins < 2 ? 'just now' : relativeLabel(iso)
}

function localZone(): string {
  const time = formatKickoff(new Date().toISOString()).time
  return time.slice(time.lastIndexOf(' ') + 1)
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
    liveFeed,
  } = useAppState()

  const [view, setView] = useState<'week' | 'results' | 'tables'>('week')
  const { liveNow, featured, upcomingGroups, recentGroups, resultGroups } = useMemo(() => {
    const live = week.fixtures.filter((f) => f.status === 'live')
    const upcoming = week.fixtures.filter((f) => f.status !== 'final' && f.status !== 'live')
    const finals = week.fixtures.filter((f) => f.status === 'final')
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000
    const recent = finals.filter((f) => new Date(f.kickoffUtc).getTime() >= twoDaysAgo)
    // Every live game gets the full treatment; the "next up" card is the first game still to come.
    const featuredGame = upcoming[0] ?? (live.length === 0 ? week.fixtures[0] : undefined)
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
      liveNow: live,
      featured: featuredGame,
      upcomingGroups: groupByDay(upcomingRest),
      recentGroups: groupByDay(recent),
      resultGroups: groupByDay([...finals].sort((a, b) => b.kickoffUtc.localeCompare(a.kickoffUtc))),
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

  // Games caught in an overlap (not pairs — 80 cup ties on one afternoon would make pairs explode).
  const overlaps = useMemo(() => new Set(findConflicts(week.fixtures).flatMap((c) => [c.a.id, c.b.id])).size, [week.fixtures])

  const laterFixtures = useMemo(
    () =>
      watchLater
        .map((id) => fixtureById(id, week.fixtures))
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)),
    [watchLater, week.fixtures],
  )

  const sourceLabel = loading && week.fixtures.length === 0
    ? 'Loading fixtures…'
    : week.source === 'live'
      ? 'Live fixtures'
      : week.source === 'mixed'
        ? 'Live fixtures + saved'
        : week.source === 'cached'
          ? `Saved ${savedAgo(week.fetchedAt)}`
          : 'Bundled sample week'

  return (
    <div>
      <AppHeader />
      <section className="hero" aria-label="My Week">
        <div className="hero-top">
          <span className="mono-label light">Your local time — {localZone()}</span>
          <button
            type="button"
            className="pill-btn"
            aria-pressed={hideScores}
            onClick={toggleHideScores}
            title="Hide scores for live and finished games"
          >
            {hideScores ? 'Scores hidden' : 'Scores shown'}
          </button>
        </div>
        <h1 className="hero-title">
          Your week
          <br />
          in football
        </h1>
        {coverage.total > 0 ? (
          <dl className="hero-stats">
            <div>
              <dt>Matches</dt>
              <dd>{coverage.total}</dd>
            </div>
            <div>
              <dt>In your apps</dt>
              <dd>{coverage.owned + coverage.free}</dd>
            </div>
            <div>
              <dt>Overlaps</dt>
              <dd>{overlaps}</dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>{changeLines.length}</dd>
            </div>
          </dl>
        ) : null}
        {coverage.total > 0 && gapsLine(coverage) ? <p className="hero-gaps">{gapsLine(coverage)}</p> : null}
        <div className="hero-meta mono-label light">
          {follows.filter((id) => !id.startsWith('league:')).length} clubs · {follows.filter((id) => id.startsWith('league:')).length} competitions — {sourceLabel}
          {liveFeed === 'on' ? ' — live scores on' : ''} —{' '}
          <button className="text-btn" type="button" onClick={() => void refresh(true)}>
            Refresh
          </button>
        </div>
        {week.fixtures.length > 0 ? (
          <div className="hero-actions">
            <Link className="hero-link" to="/share">
              Share my week
            </Link>
            <Link className="hero-link" to="/watch">
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

      {follows.length > 0 && week.fixtures.length > 0 ? (
        <section aria-label="Your clubs">
          <div className="date-head">You follow</div>
          <ClubStrip follows={follows} fixtures={week.fixtures} subscribed={subscribed} />
        </section>
      ) : null}

      {laterFixtures.length > 0 ? (
        <section aria-label="Catch up later">
          <div className="date-head">Catch up later — scores hidden</div>
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
          body="My Week only lists games for the clubs you follow."
          actionTo="/clubs"
          actionLabel="Choose clubs"
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
              actionTo="/clubs"
              actionLabel="Choose clubs"
            />
          ) : (
            <>
              <div className="view-toggle" role="tablist" aria-label="Week or results">
                <button type="button" role="tab" aria-selected={view === 'week'} className={`view-tab${view === 'week' ? ' on' : ''}`} onClick={() => setView('week')}>
                  This week
                </button>
                <button type="button" role="tab" aria-selected={view === 'results'} className={`view-tab${view === 'results' ? ' on' : ''}`} onClick={() => setView('results')}>
                  Results{resultGroups.length ? ` · ${resultGroups.reduce((n, [, fx]) => n + fx.length, 0)}` : ''}
                </button>
                <button type="button" role="tab" aria-selected={view === 'tables'} className={`view-tab${view === 'tables' ? ' on' : ''}`} onClick={() => setView('tables')}>
                  Tables
                </button>
              </div>

              {view === 'tables' ? <TablesView /> : null}

              {view === 'results' ? (
                <section aria-label="Results">
                  {resultGroups.length === 0 ? (
                    <p className="disclaimer">No finished games for what you follow in the last {RESULTS_DAYS} days.</p>
                  ) : null}
                  {resultGroups.map(([day, fixtures]) => (
                    <section key={`res-${day}`}>
                      <div className="date-head">{day}</div>
                      {fixtures.map((fixture) => (
                        <GameRow key={fixture.id} fixture={fixture} subscribed={subscribed} />
                      ))}
                    </section>
                  ))}
                  <p className="source-note">Results go back {RESULTS_DAYS} days. Scores follow your Hide scores setting.</p>
                </section>
              ) : null}

              {view === 'week' && liveNow.length > 0 ? (
                <section aria-label="Live now">
                  <div className="date-head live-head">
                    <span className="pulse-dot" aria-hidden="true" />
                    Live now · {liveNow.length}
                  </div>
                  {liveNow.map((fixture) => (
                    <FeaturedGame key={fixture.id} fixture={fixture} subscribed={subscribed} />
                  ))}
                </section>
              ) : null}
              {view === 'week' && featured ? (
                <section aria-label="Next up">
                  {liveNow.length > 0 ? <div className="date-head">Next up</div> : null}
                  <FeaturedGame fixture={featured} subscribed={subscribed} />
                </section>
              ) : null}
              {view === 'week' && upcomingGroups.map(([day, fixtures]) => (
                <section key={`up-${day}`}>
                  <div className="date-head">{day}</div>
                  {fixtures.map((fixture) => (
                    <GameRow key={fixture.id} fixture={fixture} subscribed={subscribed} />
                  ))}
                </section>
              ))}
              {view === 'week' && recentGroups.length > 0 ? (
                <>
                  <div className="date-head strong" style={{ marginTop: 22 }}>
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

      <p className="lock-note">Never streams or embeds video. Buttons open the provider.</p>
    </div>
  )
}
