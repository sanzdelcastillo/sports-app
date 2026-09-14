import { AppHeader } from '../components/AppHeader'
import { ClubPicker } from '../components/ClubPicker'
import { useAppState } from '../stores/AppState'

export function Clubs() {
  const { follows } = useAppState()
  return (
    <div>
      <AppHeader />
      <h1 className="page-title">Following</h1>
      <p className="disclaimer">
        {follows.length === 0
          ? 'Follow a club or a competition to start your week.'
          : `${follows.length} followed. Tap to follow or unfollow; competitions are under the first tab.`}
      </p>
      <ClubPicker />
    </div>
  )
}
