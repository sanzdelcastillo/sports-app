import { AppHeader } from '../components/AppHeader'
import { ClubPicker } from '../components/ClubPicker'
import { useAppState } from '../stores/AppState'

export function Clubs() {
  const { follows } = useAppState()
  return (
    <div>
      <AppHeader />
      <h1 className="page-title">Clubs</h1>
      <p className="disclaimer">
        {follows.length === 0 ? 'Follow a club to start your week.' : `${follows.length} followed. Tap a club to follow or unfollow.`}
      </p>
      <ClubPicker />
    </div>
  )
}
