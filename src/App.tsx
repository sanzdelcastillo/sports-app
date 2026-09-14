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

function themeFor(pathname: string): string {
  if (pathname.startsWith('/game')) return 'detail'
  if (pathname.startsWith('/news')) return 'news'
  if (pathname.startsWith('/remind')) return 'remind'
  if (pathname.startsWith('/conflicts')) return 'conflicts'
  if (pathname.startsWith('/follows')) return 'follows'
  if (pathname.startsWith('/watch')) return 'watch'
  if (pathname.startsWith('/share')) return 'week'
  return 'week'
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    document.body.dataset.theme = themeFor(location.pathname)
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
