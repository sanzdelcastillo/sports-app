import { useState } from 'react'
import type { Team } from '../domain/types'

interface Props {
  team?: Team
  size?: 'sm' | 'md' | 'lg'
}

export function TeamCrest({ team, size = 'md' }: Props) {
  const [failed, setFailed] = useState<'primary' | 'all' | null>(null)
  const src =
    failed === 'primary' ? team?.espnLogoUrl : failed === 'all' ? undefined : team?.badgeUrl

  return (
    <div className={`crest ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : ''}`} aria-hidden={!team}>
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => {
            if (failed === null && team?.espnLogoUrl) setFailed('primary')
            else setFailed('all')
          }}
        />
      ) : (
        <span className="crest-fallback">{team?.shortName ?? '?'}</span>
      )}
    </div>
  )
}
