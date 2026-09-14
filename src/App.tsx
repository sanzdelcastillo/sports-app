import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Clubs } from './screens/Clubs'
import { Conflicts } from './screens/Conflicts'
import { GameDetail } from './screens/GameDetail'
import { MyWeek } from './screens/MyWeek'
import { News } from './screens/News'
import { Settings } from './screens/Settings'
import { ShareWeek } from './screens/ShareWeek'
import { Watch } from './screens/Watch'
import { Welcome } from './screens/Welcome'
import { onAlertTap } from './native/alerts'
import { useAppState } from './stores/AppState'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { onboarded } = useAppState()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    onAlertTap((fixtureId) => navigate(`/game/${fixtureId}`))
  }, [navigate])

  // Shared game links open for anyone; everything else waits for the welcome flow.
  const guestOk = location.pathname === '/welcome' || location.pathname.startsWith('/game/')
  if (!onboarded && !guestOk) {
    return <Navigate to="/welcome" replace />
  }

  const inWelcome = location.pathname === '/welcome'

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/" element={<MyWeek />} />
        <Route path="/game/:id" element={<GameDetail />} />
        <Route path="/conflicts" element={<Conflicts />} />
        <Route path="/news" element={<News />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/follows" element={<Navigate to="/clubs" replace />} />
        <Route path="/watch" element={<Watch />} />
        <Route path="/share" element={<ShareWeek />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {inWelcome || !onboarded ? null : <BottomNav />}
    </div>
  )
}
