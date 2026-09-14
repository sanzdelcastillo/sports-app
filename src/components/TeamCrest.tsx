import { useState } from 'react'
import type { Team } from '../domain/types'
import { useAppState } from '../stores/AppState'

interface Props {
  team?: Team
  size?: 'sm' | 'md' | 'lg'
}

export function TeamCrest({ team, size = 'md' }: Props) {
  const { showCrests } = useAppState()
  const [failed, setFailed] = useState<'primary' | 'all' | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [crestKey, setCrestKey] = useState(team?.id)

  if (team?.id !== crestKey) {
    setCrestKey(team?.id)
    setFailed(null)
    setLoaded(false)
  }

  const espn = team?.espnLogoUrl
  const sportsDb = team?.badgeUrl
  const primary = espn ?? sportsDb
  const secondary = espn && sportsDb && espn !== sportsDb ? sportsDb : undefined
  const src = !showCrests ? undefined : failed === 'primary' ? secondary : failed === 'all' ? undefined : primary

  return (
    <div className={`crest ${size}${!showCrests ? ' text' : ''}`} aria-hidden={!team} style={!showCrests && team ? { background: team.color, borderColor: team.color } : undefined}>
      {src ? (
        <img
          src={src}
          alt=""
          className={loaded ? 'is-loaded' : ''}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false)
            if (failed === null && secondary) setFailed('primary')
            else setFailed('all')
          }}
        />
      ) : null}
      {!loaded || !showCrests ? <span className="crest-fallback">{team?.shortName ?? '?'}</span> : null}
    </div>
  )
}
