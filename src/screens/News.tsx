import { AppHeader } from '../components/AppHeader'
import { EmptyState } from '../components/EmptyState'
import { TeamCrest } from '../components/TeamCrest'
import { getTeam } from '../data/teams'
import { newsForFollows } from '../services/news'
import { useAppState } from '../stores/AppState'

export function News() {
  const { follows } = useAppState()
  const items = newsForFollows(follows)

  return (
    <div>
      <AppHeader />
      <h1 className="page-title">News</h1>
      <p className="disclaimer">Follow-only notes. Links go out to the web — no in-app video.</p>
      {follows.length === 0 ? (
        <EmptyState
          title="Follow a club first"
          body="News is limited to teams you follow."
          actionTo="/follows"
          actionLabel="Choose follows"
        />
      ) : items.length === 0 ? (
        <EmptyState title="No notes yet" body="When we have a follow-only headline, it will show up here." />
      ) : (
        <div className="stack">
          {items.map((item) => {
            const team = getTeam(item.teamIds[0])
            return (
              <a key={item.id} className="card news-row" href={item.url} target="_blank" rel="noreferrer">
                <TeamCrest team={team} size="sm" />
                <div className="meta">
                  <h3>{item.headline}</h3>
                  <p>
                    {item.source} · {item.summary}
                  </p>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
