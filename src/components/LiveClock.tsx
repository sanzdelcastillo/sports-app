import { useEffect, useState } from 'react'
import type { Fixture } from '../domain/types'

const HALF_END: Record<string, number> = { '1H': 45, '2H': 90, ET: 120 }

/**
 * A clock that visibly runs. The feed reports a minute every couple of minutes; between reports we
 * count seconds locally from the moment we saw that minute, and stop at the end of the period.
 */
export function liveClockLabel(fixture: Fixture, now = Date.now()): { text: string; running: boolean } {
  const period = (fixture.livePeriod ?? '').toUpperCase()
  if (period === 'HT') return { text: 'HT', running: false }
  if (period === 'PEN') return { text: 'PENS', running: false }
  if (period === 'BT') return { text: 'BREAK', running: false }
  let baseMinute = fixture.liveMinute
  let baseAt = fixture.liveMinuteAt ? new Date(fixture.liveMinuteAt).getTime() : undefined
  if (baseMinute === undefined || baseAt === undefined) {
    // No minute from the feed yet: estimate from kickoff (second half assumes a 15-minute break).
    const kick = new Date(fixture.kickoffUtc).getTime()
    if (!Number.isFinite(kick) || (period !== '1H' && period !== '2H')) {
      const d = fixture.statusDetail
      return { text: d && d.toLowerCase() !== 'live' ? d : 'LIVE', running: false }
    }
    baseMinute = 0
    baseAt = period === '2H' ? kick + 60 * 60_000 : kick
    if (period === '2H') baseMinute = 45
  }
  const elapsed = Math.max(0, Math.floor((now - baseAt) / 1000))
  const cap = HALF_END[period]
  const rawMinute = baseMinute + Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  if (cap && rawMinute >= cap) {
    const extra = rawMinute - cap
    return { text: extra > 0 ? `${cap}+${extra}'` : `${cap}'`, running: true }
  }
  return { text: `${rawMinute}:${String(seconds).padStart(2, '0')}`, running: true }
}

export function LiveClock({ fixture, className }: { fixture: Fixture; className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  const live = fixture.status === 'live'
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])
  const { text, running } = liveClockLabel(fixture, now)
  return (
    <span className={`live-clock${running ? ' running' : ''}${className ? ` ${className}` : ''}`} aria-live="off">
      <span className="pulse-dot" aria-hidden="true" />
      <span className="live-clock-text">{text}</span>
    </span>
  )
}
