import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Conflicts } from './screens/Conflicts'
import { Follows } from './screens/Follows'
import { GameDetail } from './screens/GameDetail'
import { MyWeek } from './screens/MyWeek'
import { News } from './screens/News'
import { Remind } from './screens/Remind'
import { ShareWeek } from './screens/ShareWeek'
import { Watch } from './screens/Watch'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<MyWeek />} />
        <Route path="/game/:id" element={<GameDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/remind" element={<Remind />} />
        <Route path="/conflicts" element={<Conflicts />} />
        <Route path="/follows" element={<Follows />} />
        <Route path="/watch" element={<Watch />} />
        <Route path="/share" element={<ShareWeek />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
