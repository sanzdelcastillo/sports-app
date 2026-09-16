import { useState } from 'react'
import type { FollowedPlayer } from '../services/players'
import { useAppState } from '../stores/AppState'

function initials(name: string): string {
  const parts = name.replace(/\./g, '').split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase()
}

/** Player photo with an initials fallback; hidden entirely when images are switched off. */
export function PlayerFace({ player, size = 'md' }: { player: Pick<FollowedPlayer, 'name' | 'photo'>; size?: 'sm' | 'md' | 'lg' }) {
  const { showCrests } = useAppState()
  const [failed, setFailed] = useState(false)
  const show = showCrests && player.photo && !failed
  return (
    <span className={`player-face ${size}`} aria-hidden="true">
      {show ? <img src={player.photo} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span className="player-initials">{initials(player.name)}</span>}
    </span>
  )
}
