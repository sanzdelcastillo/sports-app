import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { TeamCrest } from '../components/TeamCrest'
import { followableTeams, SEED_FOLLOW_IDS } from '../data/teams'
import { useAppState } from '../stores/AppState'

export function Follows() {
  const { follows, followSet, toggleFollow } = useAppState()
  const teams = followableTeams()
  const seeded = teams.filter((t) => t.seedFollow)
  const more = teams.filter((t) => !t.seedFollow)

  return (
    <div>
      <AppHeader />
      <h1 className="page-title">Follows</h1>
      <p className="disclaimer">
        {follows.length} followed · Julio’s 11 are pre-selected. Logos are public crests (TheSportsDB / ESPN CDN).
      </p>
      <Link className="cta secondary" to="/watch" style={{ marginBottom: 14 }}>
        My apps
      </Link>

      <div className="date-head">Julio’s 11</div>
      <div className="stack">
        {seeded.map((team) => (
          <article key={team.id} className="card follow-row">
            <TeamCrest team={team} size="sm" />
            <div className="meta">
              <h3>{team.name}</h3>
              <p>
                {team.shortName} · {team.country}
              </p>
            </div>
            <button
              type="button"
              className={`toggle${followSet.has(team.id) ? ' on' : ''}`}
              onClick={() => toggleFollow(team.id)}
              aria-pressed={followSet.has(team.id)}
            >
              {followSet.has(team.id) ? 'Following' : 'Follow'}
            </button>
          </article>
        ))}
      </div>

      <div className="date-head">More soccer</div>
      <div className="stack">
        {more.map((team) => (
          <article key={team.id} className="card follow-row">
            <TeamCrest team={team} size="sm" />
            <div className="meta">
              <h3>{team.name}</h3>
              <p>
                {team.shortName} · {team.country}
              </p>
            </div>
            <button
              type="button"
              className={`toggle${followSet.has(team.id) ? ' on' : ''}`}
              onClick={() => toggleFollow(team.id)}
              aria-pressed={followSet.has(team.id)}
            >
              {followSet.has(team.id) ? 'Following' : 'Follow'}
            </button>
          </article>
        ))}
      </div>

      {SEED_FOLLOW_IDS.every((id) => followSet.has(id)) ? null : (
        <p className="source-note">Some of Julio’s seed clubs are unfollowed — My Week only shows remaining follows.</p>
      )}
    </div>
  )
}
