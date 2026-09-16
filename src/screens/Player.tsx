import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { GameRow } from '../components/GameCard'
import { PlayerFace } from '../components/PlayerFace'
import { teamByProviderId } from '../data/teams'
import { openExternal } from '../native/external'
import { fetchHeadlines, isForYou, type Headline } from '../services/news'
import { fetchCareer, fetchCareerTotals, fetchPlayerInjuries, fetchPlayerSeason, fetchWikiCareer, totals, type Career, type CareerTotals, type PlayerInjury, type PlayerSeason, type WikiCareer } from '../services/players'
import { seasonGuess } from '../services/apiFootball'
import { useAppState } from '../stores/AppState'

function ago(iso: string | null): string {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (mins < 60) return `${mins}m`
  const h = Math.round(mins / 60)
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`
}

/** Keywords that identify one player in a headline: the full name, and the surname when it's distinctive. */
export function playerKeywords(name: string, fullName?: string): string[] {
  const words: string[] = []
  if (fullName) words.push(fullName.toLowerCase())
  const parts = name.replace(/\./g, '').split(/\s+/).filter(Boolean)
  const surname = parts[parts.length - 1]
  if (surname && surname.length >= 6) words.push(surname.toLowerCase())
  if (parts.length >= 2 && parts[0].length > 2) words.push(name.toLowerCase())
  return [...new Set(words)]
}

function CareerBlock({ label, side, keeper, caps = false }: { label: string; side: CareerTotals['club']; keeper: boolean; caps?: boolean }) {
  const perGame = side.apps > 0 ? (side.goals / side.apps).toFixed(2) : '—'
  return (
    <div className="career-block">
      <div className="career-block-label mono-label">{label}</div>
      <dl className="career-totals">
        <div>
          <dt>{caps ? 'Caps' : 'Games'}</dt>
          <dd>{side.apps.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Goals</dt>
          <dd>{side.goals.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Assists</dt>
          <dd>{side.assists.toLocaleString()}</dd>
        </div>
        <div>
          <dt>{keeper ? 'Conceded' : 'Per game'}</dt>
          <dd>{keeper ? side.conceded.toLocaleString() : perGame}</dd>
        </div>
      </dl>
      <div className="career-fine mono-label">
        {Math.round(side.minutes).toLocaleString()} min · pens {side.penScored}/{side.penScored + side.penMissed} · {side.yellow}Y {side.red}R
        {keeper ? ` · ${side.saves.toLocaleString()} saves` : ''}
      </div>
    </div>
  )
}

export function Player() {
  const { id } = useParams<{ id: string }>()
  const { players, week, subscribed, isPlayerFollowed, followPlayer, unfollowPlayer, hideScores } = useAppState()
  const known = players.find((p) => p.id === id)
  const [season, setSeason] = useState<PlayerSeason | null>(null)
  const [seasonYear, setSeasonYear] = useState<number>(seasonGuess())
  const [career, setCareer] = useState<Career | null>(null)
  const [careerTotals, setCareerTotals] = useState<CareerTotals | null>(null)
  const [wiki, setWiki] = useState<WikiCareer | null | undefined>(undefined)
  const [injuries, setInjuries] = useState<PlayerInjury[]>([])
  const [news, setNews] = useState<Headline[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setSeason(null)
    setError(false)
    fetchPlayerSeason(id, seasonYear)
      .then((s) => {
        if (!cancelled) setSeason(s)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [id, seasonYear])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setCareer(null)
    setCareerTotals(null)
    fetchCareer(id)
      .then((c) => {
        if (cancelled) return
        setCareer(c)
        return fetchCareerTotals(id, c.seasons).then((t) => {
          if (!cancelled) setCareerTotals(t)
        })
      })
      .catch(() => undefined)
    fetchPlayerInjuries(id)
      .then((list) => {
        if (!cancelled) setInjuries(list)
      })
      .catch(() => undefined)
    fetchHeadlines()
      .then((d) => {
        if (!cancelled) setNews(d.items)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [id])

  const player = season?.player ?? known
  const isKeeper = /goalkeeper/i.test(player?.position ?? '')

  // Career totals as fans know them: Wikipedia's career-statistics tables (every competition, updated after each game).
  useEffect(() => {
    if (!id || wiki !== undefined) return
    const p = season?.player
    if (!p) return
    let cancelled = false
    fetchWikiCareer({ id, name: p.name, fullName: p.fullName, birthDate: p.birthDate, teamName: p.teamName })
      .then((w) => {
        if (!cancelled) setWiki(w)
      })
      .catch(() => {
        if (!cancelled) setWiki(null)
      })
    return () => {
      cancelled = true
    }
  }, [id, season, wiki])
  const keywords = useMemo(() => (player ? playerKeywords(player.name, player.fullName) : []), [player])
  const about = useMemo(() => (news ?? []).filter((h) => isForYou(h, keywords)).slice(0, 8), [news, keywords])
  const clubTeam = player?.teamProviderId ? teamByProviderId(player.teamProviderId) : undefined
  const clubGames = useMemo(
    () => (clubTeam ? week.fixtures.filter((f) => (f.homeTeamId === clubTeam.id || f.awayTeamId === clubTeam.id) && f.status !== 'final').slice(0, 3) : []),
    [week.fixtures, clubTeam],
  )
  const recentInjury = injuries.find((i) => Date.now() - new Date(i.date).getTime() < 21 * 24 * 60 * 60 * 1000)

  if (!id || (!player && (error || (!known && season === null && error)))) {
    return (
      <div>
        <AppHeader />
        <EmptyState title="Player not found" body="That link doesn't point at a player we can find." actionTo="/clubs" actionLabel="Back to Following" />
      </div>
    )
  }

  const followed = isPlayerFollowed(id)
  const club = season ? totals(season.rows, true) : null
  const all = season ? totals(season.rows) : null

  return (
    <div>
      <AppHeader />
      <Link className="back" to="/">
        ← My Week
      </Link>

      <article className="card card-featured player-hero">
        <div className="player-hero-top">
          {player ? <PlayerFace player={player} size="lg" /> : null}
          <div className="player-hero-meta">
            <h1 className="player-hero-name">{player?.name ?? 'Loading…'}</h1>
            <div className="mono-label light">
              {[player?.position, player?.number ? `#${player.number}` : null, player?.teamName, player?.nationality, player?.age ? `${player.age} yrs` : null].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button
            type="button"
            className={`toggle${followed ? ' on' : ''}`}
            aria-pressed={followed}
            onClick={() => {
              if (followed) unfollowPlayer(id)
              else if (player && !followPlayer(player)) setError(false)
            }}
          >
            {followed ? 'Following' : 'Follow'}
          </button>
        </div>
        {recentInjury || season?.player.injured ? (
          <div className="player-injury">
            {recentInjury ? `${recentInjury.type}: ${recentInjury.reason}` : 'Currently listed as injured'}
          </div>
        ) : null}
        {club ? (
          <dl className="player-stats-strip">
            <div>
              <dt>Games</dt>
              <dd>{club.apps}</dd>
            </div>
            <div>
              <dt>Goals</dt>
              <dd>{club.goals}</dd>
            </div>
            <div>
              <dt>Assists</dt>
              <dd>{club.assists}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{club.rating ?? '—'}</dd>
            </div>
          </dl>
        ) : null}
        <div className="mono-label light player-hero-foot">{season ? `${season.season} season · club competitions` : error ? 'Season numbers unavailable' : 'Loading season numbers…'}</div>
      </article>

      {career && career.seasons.length > 1 ? (
        <div className="season-chips" role="tablist" aria-label="Season">
          {career.seasons.map((y) => (
            <button key={y} type="button" role="tab" aria-selected={seasonYear === y} className={`league-chip${seasonYear === y ? ' on' : ''}`} onClick={() => setSeasonYear(y)}>
              {y}/{String(y + 1).slice(-2)}
            </button>
          ))}
        </div>
      ) : null}

      {season && season.rows.length === 0 ? <p className="disclaimer">No games recorded for the {seasonYear}/{String(seasonYear + 1).slice(-2)} season.</p> : null}

      {season && season.rows.length > 0 ? (
        <section className="card">
          <h2 className="display-head">By competition · {season.season}/{String(season.season + 1).slice(-2)}</h2>
          <table className="standings player-table" aria-label="Season statistics by competition">
            <thead>
              <tr>
                <th scope="col" className="left">
                  Competition
                </th>
                <th scope="col">P</th>
                <th scope="col">G</th>
                <th scope="col">A</th>
                <th scope="col">Min</th>
                <th scope="col">Rtg</th>
              </tr>
            </thead>
            <tbody>
              {season.rows.map((r) => (
                <tr key={`${r.teamProviderId}-${r.league}`}>
                  <td className="left">
                    <span className="club-cell">
                      {r.league}
                      {r.isNationalTeam ? <span className="mono-label"> · {r.team}</span> : null}
                    </span>
                  </td>
                  <td>{r.apps}</td>
                  <td className="pts">{r.goals}</td>
                  <td>{r.assists}</td>
                  <td>{r.minutes}</td>
                  <td>{r.rating ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {all ? (
            <p className="source-note">
              All competitions incl. national team: {all.apps} games, {all.goals} goals, {all.assists} assists. Shots on target {season.rows.reduce((n, r) => n + r.shotsOn, 0)}/{season.rows.reduce((n, r) => n + r.shots, 0)} · key passes{' '}
              {season.rows.reduce((n, r) => n + r.keyPasses, 0)} · dribbles {season.rows.reduce((n, r) => n + r.dribbles, 0)} · cards {season.rows.reduce((n, r) => n + r.yellow, 0)}Y {season.rows.reduce((n, r) => n + r.red, 0)}R.
            </p>
          ) : null}
        </section>
      ) : null}

      {career && career.clubs.length > 0 ? (
        <section className="card">
          <h2 className="display-head">Career</h2>
          {!careerTotals ? <p className="disclaimer">Adding up {career.seasons.length} seasons…</p> : null}
          {careerTotals && careerTotals.seasonsCounted > 0 ? (
            <>
              {(() => {
                const w = wiki ?? null
                const clubGoals = w?.clubGoals ?? careerTotals.club.goals
                const clubApps = w?.clubApps ?? careerTotals.club.apps
                const intlGoals = w?.intlGoals ?? careerTotals.country.goals
                const intlApps = w?.intlApps ?? careerTotals.country.apps
                const clubSide = { ...careerTotals.club, goals: clubGoals, apps: clubApps }
                const countrySide = { ...careerTotals.country, goals: intlGoals, apps: intlApps }
                const updated = w?.clubUpdated?.replace(/^\d{1,2}:\d{2}, /, '').replace(/ \(UTC\)$/, '')
                return (
                  <>
                    <div className="career-headline">
                      <span className="career-headline-num">{(clubGoals + intlGoals).toLocaleString()}</span>
                      <span className="career-headline-label">
                        career goals
                        <span className="career-headline-sub">
                          {(clubApps + intlApps).toLocaleString()} games · {clubGoals.toLocaleString()} club + {intlGoals.toLocaleString()} country
                        </span>
                      </span>
                    </div>
                    <CareerBlock label="Club career" side={clubSide} keeper={isKeeper} />
                    {countrySide.apps > 0 ? <CareerBlock label="National team" side={countrySide} keeper={isKeeper} caps /> : null}
                    <p className="source-note">
                      {w ? (
                        <>
                          Games and goals: Wikipedia{updated ? `, updated ${updated}` : ''} — every competition, senior national team only. Assists, minutes, penalties and cards from our match data since{' '}
                          {careerTotals.assistsSince ?? careerTotals.since}.
                        </>
                      ) : (
                        <>
                          From our match data since {careerTotals.since} ({careerTotals.seasonsCounted} seasons), competitive games only. Official tallies can run higher where older cups are missing.
                        </>
                      )}
                    </p>
                  </>
                )
              })()}
            </>
          ) : null}
          <div className="date-head">Clubs</div>
          <ul className="career-list">
            {career.clubs.map((c) => (
              <li key={c.teamProviderId} className="career-row">
                <span className="career-team">{c.team}</span>
                <span className="career-years">
                  {c.seasons.length > 1 ? `${c.seasons[c.seasons.length - 1]}–${c.seasons[0] === seasonGuess() ? 'now' : c.seasons[0] + 1}` : `${c.seasons[0]}/${String(c.seasons[0] + 1).slice(-2)}`}
                  {' · '}
                  {c.seasons.length} season{c.seasons.length === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
          {career.trophies.length > 0 ? (
            <>
              <div className="date-head">Honours</div>
              {career.trophies.slice(0, 12).map((t, i) => (
                <div key={`${t.competition}-${t.season}-${i}`} className="trophy-row">
                  <span>{t.competition}</span>
                  <span className="mono-label">{t.season}</span>
                </div>
              ))}
              {career.trophies.length > 12 ? <p className="source-note">And {career.trophies.length - 12} more.</p> : null}
            </>
          ) : null}
        </section>
      ) : null}

      {clubGames.length > 0 ? (
        <section>
          <div className="date-head">{clubTeam?.name} next</div>
          {clubGames.map((f) => (
            <GameRow key={f.id} fixture={f} subscribed={subscribed} />
          ))}
        </section>
      ) : null}

      <section>
        <div className="date-head">In the news</div>
        {news === null ? <p className="disclaimer">Loading headlines…</p> : null}
        {news && about.length === 0 ? <p className="disclaimer">No recent headlines mention {player?.name ?? 'this player'}.</p> : null}
        <div className="headlines">
          {about.map((h) => (
            <a
              key={h.link}
              className="headline"
              href={h.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault()
                void openExternal(h.link)
              }}
            >
              <span className="headline-title">{h.title}</span>
              <span className="headline-meta mono-label">
                {h.source}
                {h.publishedAt ? ` · ${ago(h.publishedAt)}` : ''}
              </span>
            </a>
          ))}
        </div>
      </section>
      {hideScores ? <p className="source-note">Season totals are shown even with scores hidden; they don't reveal any single result.</p> : null}
    </div>
  )
}
