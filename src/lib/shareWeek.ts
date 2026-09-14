import { getTeam } from '../data/teams'
import { accessFor, RIGHTS_REVIEWED_ON } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { formatKickoff } from './time'

export interface ShareOptions {
  /** Add "(in your apps)" / "(free)" / "(needs X)" after each destination. */
  includeAccess: boolean
}

function longDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function accessSuffix(fixture: Fixture, subscribed: DestinationId[]): string {
  const access = accessFor(fixture, subscribed)
  if (access.state === 'owned') return ' (in your apps)'
  if (access.state === 'free') return ' (free)'
  if (access.state === 'missing') return ' (not in your apps)'
  return ''
}

/**
 * Builds the week as plain text: one block per day, one line per game,
 * kickoff in U.S. Eastern, then where to watch. Pastes cleanly into a text or email.
 */
export function buildWeekText(
  fixtures: Fixture[],
  subscribed: DestinationId[],
  options: ShareOptions,
  now = new Date(),
): string {
  const upcoming = fixtures
    .filter((f) => f.status !== 'final')
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc))

  if (upcoming.length === 0) {
    return 'No upcoming games for your clubs in the next 7 days.'
  }

  const first = upcoming[0].kickoffUtc
  const last = upcoming[upcoming.length - 1].kickoffUtc
  const range = longDate(first) === longDate(last) ? longDate(first) : `${longDate(first)} – ${longDate(last)}`

  const lines: string[] = [`This week's games (${range}, U.S. Eastern)`, '']

  let currentDay = ''
  for (const fixture of upcoming) {
    const kick = formatKickoff(fixture.kickoffUtc)
    if (kick.day !== currentDay) {
      if (currentDay) lines.push('')
      currentDay = kick.day
      lines.push(kick.day)
    }
    const home = getTeam(fixture.homeTeamId)?.name ?? fixture.homeTeamId
    const away = getTeam(fixture.awayTeamId)?.name ?? fixture.awayTeamId
    const access = accessFor(fixture, subscribed)
    const where =
      access.state === 'unknown'
        ? 'Check listings'
        : access.destination.shortName + (options.includeAccess ? accessSuffix(fixture, subscribed) : '')
    const flag = fixture.mustWatch ? ' ★' : ''
    lines.push(`${kick.time} · ${home} vs ${away} · ${fixture.leagueName}${flag}`)
    lines.push(`   Watch: ${where}`)
  }

  const built = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now)
  const reviewed = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${RIGHTS_REVIEWED_ON}T12:00:00Z`),
  )

  lines.push('', `Built ${built}. Where-to-watch reviewed ${reviewed}. Confirm on the provider before kickoff.`)
  return lines.join('\n')
}
