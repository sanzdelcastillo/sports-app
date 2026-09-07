import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { ClockIcon } from '../components/icons'
import { TeamCrest } from '../components/TeamCrest'
import { AvailabilityBadge, WatchCta } from '../components/WatchCta'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import { destinationsForFixture, primaryDestination } from '../data/watch'
import { scoreLabel } from '../lib/status'
import { formatKickoff, formatVenueDate } from '../lib/time'
import { fixtureById } from '../services/fixtures'
import { newsForFixture } from '../services/news'
import { useAppState } from '../stores/AppState'

type Tab = 'watch' | 'remind' | 'news'

export function GameDetail() {
  const { id = '' } = useParams()
  const { week, subscribed, hasReminder, toggleReminder } = useAppState()
  const fixture = fixtureById(id, week.fixtures)
  const [tab, setTab] = useState<Tab>('watch')

  const home = fixture ? getTeam(fixture.homeTeamId) : undefined
  const away = fixture ? getTeam(fixture.awayTeamId) : undefined
  const kick = fixture ? formatKickoff(fixture.kickoffUtc) : null
  const league = fixture ? LEAGUES[fixture.leagueId] : null
  const dests = fixture ? destinationsForFixture(fixture, subscribed) : []
  const primary = fixture ? primaryDestination(fixture, subscribed) : null
  const news = useMemo(
    () => (fixture ? newsForFixture([fixture.homeTeamId, fixture.awayTeamId]) : []),
    [fixture],
  )

  if (!fixture || !home || !away || !kick || !league || !primary) {
    return (
      <div>
        <AppHeader accent="orange" />
        <Link className="back" to="/">
          ← My Week
        </Link>
        <EmptyState
          title="Game not found"
          body="That fixture is not in the current week window."
          actionTo="/"
          actionLabel="Back to My Week"
        />
      </div>
    )
  }

  return (
    <div>
      <AppHeader accent="orange" />
      <Link className="back" to="/">
        ← My Week
      </Link>

      <article className="card card-featured">
        <div className="match-head" style={{ justifyContent: 'center' }}>
          {league.shortName}
        </div>
        <div className="matchup">
          <div className="side">
            <TeamCrest team={home} size="lg" />
            <div className="name">{home.name}</div>
            {fixture.homeRecord ? <div className="record">{fixture.homeRecord}</div> : null}
          </div>
          <div className="kick">
            <div className="time">{kick.time}</div>
            <div className="scores">
              <span>{scoreLabel(fixture.homeScore, fixture.status)}</span>
              <span>{scoreLabel(fixture.awayScore, fixture.status)}</span>
            </div>
          </div>
          <div className="side">
            <TeamCrest team={away} size="lg" />
            <div className="name">{away.name}</div>
            {fixture.awayRecord ? <div className="record">{fixture.awayRecord}</div> : null}
          </div>
        </div>
        <p className="venue">
          {fixture.venue} · {formatVenueDate(fixture.kickoffUtc)}
        </p>
        <div className="row-gap">
          <WatchCta fixture={fixture} subscribed={subscribed} wide />
          <button
            type="button"
            className="icon-btn"
            aria-label={hasReminder(fixture.id) ? 'Remove reminder' : 'Add reminder'}
            aria-pressed={hasReminder(fixture.id)}
            onClick={() => toggleReminder(fixture.id)}
          >
            <ClockIcon width={20} height={20} />
          </button>
        </div>
        <div className="badges" style={{ marginTop: 12 }}>
          {fixture.status === 'live' ? <span className="badge live">● LIVE</span> : null}
          {fixture.status === 'final' ? <span className="badge">Final</span> : null}
          {fixture.status === 'scheduled' ? <span className="badge ghost">Upcoming</span> : null}
          <span className="badge ghost">
            on {primary.shortName}
            {fixture.mustWatch ? ' · Must-watch' : ''}
          </span>
        </div>
      </article>

      <div className="tabs" role="tablist" aria-label="Game details">
        <button type="button" className="tab" role="tab" aria-selected={tab === 'watch'} onClick={() => setTab('watch')}>
          Where to watch
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'remind'} onClick={() => setTab('remind')}>
          Reminder
        </button>
        <button type="button" className="tab" role="tab" aria-selected={tab === 'news'} onClick={() => setTab('news')}>
          News
        </button>
      </div>

      {tab === 'watch' ? (
        <section>
          <h2 className="date-head">Where to watch</h2>
          <p className="disclaimer">Info only — opens the provider site. No in-app video.</p>
          <div className="stack">
            {dests.map((dest) => (
              <a key={dest.id} className="card watch-card" href={dest.url} target="_blank" rel="noreferrer">
                <div>
                  <h3>{dest.name}</h3>
                  <p>{dest.note}</p>
                </div>
                <AvailabilityBadge availability={dest.availability} />
              </a>
            ))}
          </div>
          <p className="source-note">
            Prefer a service you already pay for? Mark it on{' '}
            <Link to="/watch" style={{ textDecoration: 'underline' }}>
              Watch destinations
            </Link>
            .
          </p>
        </section>
      ) : null}

      {tab === 'remind' ? (
        <section className="card">
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Device reminder</h2>
          <p className="disclaimer">
            v1 stores a local reminder only. This app does not send push notifications and never starts a stream.
          </p>
          <button type="button" className="cta wide" onClick={() => toggleReminder(fixture.id)}>
            {hasReminder(fixture.id) ? 'Remove reminder' : 'Remind me'}
          </button>
        </section>
      ) : null}

      {tab === 'news' ? (
        <section className="stack">
          {news.length === 0 ? (
            <EmptyState title="No follow-only notes yet" body="Headlines appear when we have a note for these clubs." />
          ) : (
            news.map((item) => (
              <a key={item.id} className="card news-row" href={item.url} target="_blank" rel="noreferrer">
                <div className="meta">
                  <h3>{item.headline}</h3>
                  <p>
                    {item.source} · {item.summary}
                  </p>
                </div>
              </a>
            ))
          )}
        </section>
      ) : null}
    </div>
  )
}
