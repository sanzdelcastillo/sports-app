import { LocalNotifications } from '@capacitor/local-notifications'
import { getTeam } from '../data/teams'
import { accessFor } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { parseUtc } from '../lib/time'
import { isNative } from './platform'

export const ALERT_LEAD_MINUTES = 15
const CHANNEL_ID = 'kickoffs'

/** Stable positive int id per fixture so re-scheduling replaces rather than duplicates. */
export function notificationId(fixtureId: string): number {
  let h = 0
  for (const ch of fixtureId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 2_000_000_000) + 1
}

export async function alertsPermitted(): Promise<boolean> {
  if (!isNative()) return false
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return true
  const asked = await LocalNotifications.requestPermissions()
  return asked.display === 'granted'
}

/**
 * Schedule one notification per upcoming followed game, 15 minutes before kickoff,
 * and drop any we scheduled before that no longer apply.
 */
export async function scheduleKickoffAlerts(fixtures: Fixture[], subscribed: DestinationId[]): Promise<number> {
  if (!isNative()) return 0
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Kickoff alerts',
      description: '15 minutes before your clubs play',
      importance: 4,
    })
  } catch {
    /* iOS has no channels */
  }

  const now = Date.now()
  const wanted = fixtures
    .filter((f) => f.status === 'scheduled' && parseUtc(f.kickoffUtc).getTime() - ALERT_LEAD_MINUTES * 60_000 > now)
    .slice(0, 60)

  const pending = await LocalNotifications.getPending()
  const keep = new Set(wanted.map((f) => notificationId(f.id)))
  const stale = pending.notifications.filter((n) => !keep.has(n.id)).map((n) => ({ id: n.id }))
  if (stale.length) await LocalNotifications.cancel({ notifications: stale })

  if (wanted.length === 0) return 0
  await LocalNotifications.schedule({
    notifications: wanted.map((f) => {
      const home = getTeam(f.homeTeamId)?.shortName ?? 'Home'
      const away = getTeam(f.awayTeamId)?.shortName ?? 'Away'
      const access = accessFor(f, subscribed)
      const where = access.state === 'unknown' ? 'Check where to watch' : `On ${access.destination.shortName}`
      return {
        id: notificationId(f.id),
        title: `${home} vs ${away} in ${ALERT_LEAD_MINUTES} min`,
        body: `${f.leagueName}. ${where}.`,
        schedule: { at: new Date(parseUtc(f.kickoffUtc).getTime() - ALERT_LEAD_MINUTES * 60_000), allowWhileIdle: true },
        channelId: CHANNEL_ID,
        extra: { fixtureId: f.id },
      }
    }),
  })
  return wanted.length
}

export async function cancelAllAlerts(): Promise<void> {
  if (!isNative()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  }
}

/** Tapping a kickoff alert opens that game. */
export function onAlertTap(handler: (fixtureId: string) => void): void {
  if (!isNative()) return
  void LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const id = (event.notification.extra as { fixtureId?: string } | undefined)?.fixtureId
    if (id) handler(id)
  })
}
