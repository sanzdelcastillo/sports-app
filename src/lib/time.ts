/** The phone's own zone, with U.S. Eastern as a fallback for odd environments. */
export const DEFAULT_TIME_ZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  } catch {
    return 'America/New_York'
  }
})()

/** Short zone label for copy, e.g. "EDT" or "GMT+1". */
export function zoneAbbr(now = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(now)
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone
}

export function parseUtc(iso: string): Date {
  return new Date(iso)
}

export function formatKickoff(
  iso: string,
  timeZone = DEFAULT_TIME_ZONE,
): { time: string; day: string; dateKey: string; weekday: string } {
  const date = parseUtc(iso)
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  })
    .format(date)
    .toUpperCase()

  const monthDay = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  }).format(date)

  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

  return {
    time,
    day: `${weekday}, ${monthDay.toUpperCase()}`,
    dateKey,
    weekday,
  }
}

export function formatVenueDate(iso: string, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(parseUtc(iso))
}

/** Week window: local today through +7 days, plus recent results from the last 2 days. */
export function weekWindow(now = new Date(), timeZone = DEFAULT_TIME_ZONE): { start: Date; end: Date } {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const start = new Date(`${dateKey}T04:00:00.000Z`)
  const recent = new Date(start.getTime() - 2 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 8 * 24 * 60 * 60 * 1000)
  return { start: recent, end }
}

export function isInWindow(iso: string, start: Date, end: Date): boolean {
  const t = parseUtc(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

export function overlapMs(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): number {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

export const MATCH_LENGTH_MS = 2.5 * 60 * 60 * 1000

export function relativeLabel(iso: string, now = new Date()): string {
  const diff = parseUtc(iso).getTime() - now.getTime()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  if (mins < 2) return diff >= 0 ? 'Starting now' : 'Just now'
  if (mins < 60) return diff >= 0 ? `In ${mins} min` : `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 36) return diff >= 0 ? `In ${hours} hr` : `${hours} hr ago`
  const days = Math.round(hours / 24)
  return diff >= 0 ? `In ${days} days` : `${days} days ago`
}
