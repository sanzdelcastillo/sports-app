import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { ChangeBadge, SaveLaterButton, Scoreboard } from '../components/GameCard'
import { CalendarPlusIcon } from '../components/icons'
import { HighlightLink, LineupsPanel, TablePanel, TvListingsPanel } from '../components/MatchExtras'
import { AccessChip, AvailabilityBadge, isOwnedDestination, OwnedChip, WatchCta } from '../components/WatchCta'
import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import { destinationsForFixture, primaryDestination, RIGHTS_REVIEWED_ON } from '../data/watch'
import { buildIcs, downloadIcs } from '../lib/ics'
import { formatVenueDate } from '../lib/time'
import { openExternal } from '../native/external'
import { fixtureById } from '../services/fixtures'
import { useAppState } from '../stores/AppState'

type Tab = 'watch' | 'lineups' | 'table' | 'calendar'

const TABS: { id: Tab; label: string }[] = [
  { id: 'watch', label: 'Watch' },
  { id: 'lineups', label: 'Lineups' },
  { id: 'table', label: 'Table' },
  { id: 'calendar', label: 'Calendar' },
]

const reviewedShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
  new Date(`${RIGHTS_REVIEWED_ON}T12:00:00Z`),
)

export function GameDetail() {
  const { id = '' } = useParams()
  const { week, subscribed } = useAppState()
  const fixture = fixtureById(id, week.fixtures)
  const [tab, setTab] = useState<Tab>('watch')

  const home = fixture ? getTeam(fixture.homeTeamId) : undefined
  const away = fixture ? getTeam(fixture.awayTeamId) : undefined
  const league = fixture ? LEAGUES[fixture.leagueId] : null
  const dests = fixture ? destinationsForFixture(fixture, subscribed) : []
  const primary = fixture ? primaryDestination(fixture, subscribed) : null

  if (!fixture || !home || !away || !league || !primary) {
    return (
      <div>
        <AppHeader />
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
      <AppHeader />
      <Link className="back" to="/">
        ← My Week
      </Link>

      <article className="card card-featured">
        <div className="match-head">
          {league.name}
        </div>
        <Scoreboard fixture={fixture} size="lg" names="full" />
        <p className="venue">
          {fixture.venue} · {formatVenueDate(fixture.kickoffUtc)}
        </p>
        <div className="row-gap">
          <WatchCta fixture={fixture} subscribed={subscribed} wide />
          <SaveLaterButton fixtureId={fixture.id} />
        </div>
        <div className="badges" style={{ marginTop: 12 }}>
          <AvailabilityBadge availability={primary.availability} />
          <AccessChip fixture={fixture} subscribed={subscribed} />
          <ChangeBadge fixtureId={fixture.id} />
          {fixture.mustWatch ? <span className="badge must">★ Must-watch</span> : null}
        </div>
        <HighlightLink fixture={fixture} />
      </article>

      <div className="tabs four" role="tablist" aria-label="Game details">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'watch' ? (
        <section>
          <h2 className="display-head">Where to watch</h2>
          <p className="disclaimer">Info only — opens the provider site. No in-app video.</p>
          <div className="stack">
            {dests.map((dest) => (
              <div key={dest.id} className="card watch-panel">
                <div className="badges">
                  <AvailabilityBadge availability={dest.availability} />
                  {dest.kind === 'free' ? (
                    <span className="badge access-free">Free</span>
                  ) : (
                    <OwnedChip owned={isOwnedDestination(dest.id, subscribed)} />
                  )}
                </div>
                <h3>{dest.name}</h3>
                <p className="watch-app">{dest.note}</p>
                <a
                  className="deep-link"
                  href={dest.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => {
                    event.preventDefault()
                    void openExternal(dest.url)
                  }}
                >
                  Open provider site ↗
                </a>
              </div>
            ))}
          </div>
          <p className="source-note">
            Where-to-watch reviewed {reviewedShort}. Tick the services you have on{' '}
            <Link to="/watch" style={{ textDecoration: 'underline' }}>
              My apps
            </Link>{' '}
            so we can label games for you.
          </p>
          <h2 className="display-head" style={{ marginTop: 20 }}>Listed U.S. broadcasts</h2>
          <p className="disclaimer">
            What the data feed has on file for this game. It is often incomplete for the U.S., so treat it as extra
            confirmation, not the whole picture.
          </p>
          <TvListingsPanel fixture={fixture} />
        </section>
      ) : null}

      {tab === 'lineups' ? (
        <section>
          <h2 className="display-head">Lineups</h2>
          <LineupsPanel fixture={fixture} />
        </section>
      ) : null}

      {tab === 'table' ? (
        <section>
          <h2 className="display-head">Table and form</h2>
          <TablePanel fixture={fixture} />
        </section>
      ) : null}

      {tab === 'calendar' ? (
        <section className="card">
          <h2 className="display-head">Add to your calendar</h2>
          <p className="disclaimer">
            Downloads a calendar file with the kickoff in your time zone and where to watch in the notes. Your
            calendar app will remind you before kickoff. If the time moves, download again — the same event updates
            instead of duplicating.
          </p>
          <button
            type="button"
            className="cta glass-pill wide"
            onClick={() => downloadIcs(`${away.shortName}-${home.shortName}`, buildIcs([fixture], subscribed, `${home.name} vs ${away.name}`))}
          >
            <CalendarPlusIcon width={18} height={18} aria-hidden="true" />
            Add to calendar
          </button>
        </section>
      ) : null}
    </div>
  )
}
