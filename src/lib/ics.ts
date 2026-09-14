import { LEAGUES } from '../data/leagues'
import { getTeam } from '../data/teams'
import { accessFor, RIGHTS_REVIEWED_ON } from '../data/watch'
import type { DestinationId, Fixture } from '../domain/types'
import { parseUtc } from './time'

const PRODID = '-//Sports Fan Planner//Week//EN'
const UID_DOMAIN = 'sports-fan-planner'

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

/** RFC 5545 text escaping: backslash, semicolon, comma, newline. */
export function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets, as the spec requires. */
function fold(line: string): string {
  const out: string[] = []
  let rest = line
  while (rest.length > 74) {
    out.push(rest.slice(0, 74))
    rest = ' ' + rest.slice(74)
  }
  out.push(rest)
  return out.join('\r\n')
}

function whereLine(fixture: Fixture, subscribed: DestinationId[]): string {
  const access = accessFor(fixture, subscribed)
  if (access.state === 'unknown') return 'Watch: check listings'
  const suffix =
    access.state === 'owned' ? ' (in your apps)' : access.state === 'free' ? ' (free)' : ' (not in your apps)'
  return `Watch: ${access.destination.shortName}${suffix}`
}

export function fixtureToVevent(fixture: Fixture, subscribed: DestinationId[], now = new Date()): string {
  const home = getTeam(fixture.homeTeamId)?.name ?? fixture.homeTeamId
  const away = getTeam(fixture.awayTeamId)?.name ?? fixture.awayTeamId
  const league = LEAGUES[fixture.leagueId]?.shortName ?? fixture.leagueName
  const start = parseUtc(fixture.kickoffUtc)
  const description = [whereLine(fixture, subscribed), `Where-to-watch reviewed ${RIGHTS_REVIEWED_ON}. Confirm on the provider.`].join(
    '\n',
  )
  const lines = [
    'BEGIN:VEVENT',
    `UID:${fixture.id}@${UID_DOMAIN}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    'DURATION:PT2H',
    `SUMMARY:${escapeIcs(`${home} vs ${away} · ${league}`)}`,
    `LOCATION:${escapeIcs(fixture.venue)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    'END:VEVENT',
  ]
  return lines.map(fold).join('\r\n')
}

/**
 * One calendar file for a set of games. UIDs are stable (the fixture id), so
 * re-importing after a kickoff moves updates the existing event in most calendar apps
 * instead of creating a duplicate.
 */
export function buildIcs(fixtures: Fixture[], subscribed: DestinationId[], name = 'My Week', now = new Date()): string {
  const head = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(name)}`,
  ]
  const body = fixtures.map((f) => fixtureToVevent(f, subscribed, now))
  return [...head.map(fold), ...body, 'END:VCALENDAR', ''].join('\r\n')
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
