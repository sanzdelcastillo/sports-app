/**
 * Checks the "My apps" labelling rules without a browser.
 * Run: npm run check:access
 */
import { accessFor, coverageFor, PROVIDERS, RIGHTS_REVIEWED_ON } from '../src/data/watch'
import type { DestinationId, Fixture, LeagueId } from '../src/domain/types'
import { diffWeek, mergeChanges, snapshotWeek } from '../src/lib/changes'
import { buildIcs, escapeIcs } from '../src/lib/ics'
import { buildWeekText } from '../src/lib/shareWeek'
import { favoritesComplete } from '../src/services/fixtures'
import { anyInPlay, applyLive, mapLive } from '../src/services/livescores'
import { groupLineup, seasonFor, shapeOf } from '../src/services/matchExtras'

let failures = 0
function expect(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ok   ${message}`)
  } else {
    failures += 1
    console.log(`  FAIL ${message}`)
  }
}

function fixture(id: string, leagueId: LeagueId, leagueName: string, status: Fixture['status'] = 'scheduled'): Fixture {
  return {
    id,
    leagueId,
    leagueName,
    kickoffUtc: '2026-09-19T14:00:00Z',
    venue: 'Test Ground',
    homeTeamId: 'ars',
    awayTeamId: 'che',
    homeScore: status === 'scheduled' ? null : 1,
    awayScore: status === 'scheduled' ? null : 0,
    status,
  }
}

const epl = fixture('epl-1', 'epl', 'Premier League')
const ucl = fixture('ucl-1', 'ucl', 'UEFA Champions League')
const buli = fixture('buli-1', 'bundesliga', 'Bundesliga')
const other = fixture('oth-1', 'other', 'Soccer')

console.log('Access states')
expect(accessFor(epl, ['peacock']).state === 'owned', 'Premier League + Peacock ticked → owned')
expect(accessFor(epl, []).state === 'missing', 'Premier League + nothing ticked → missing')
expect(accessFor(epl, []).label === 'Needs Peacock', 'missing label names the service')
expect(accessFor(buli, []).state === 'free', 'Bundesliga → free even with nothing ticked')
expect(accessFor(buli, []).destination.shortName === 'Fandango', 'Bundesliga free destination is Fandango')
expect(accessFor(other, ['peacock', 'espn-plus']).state === 'unknown', 'unmapped competition → unknown regardless of apps')
expect(accessFor(ucl, ['paramount-plus']).state === 'owned', 'UCL + Paramount+ ticked → owned')

console.log('Owned beats free, free beats missing in destination order')
const orderedBuli = accessFor(buli, ['usa-network'])
expect(orderedBuli.state === 'owned' && orderedBuli.destination.id === 'usa-network', 'ticked USA Network outranks free Fandango')

console.log('Coverage roll-up')
const cov = coverageFor([epl, ucl, buli, other], ['peacock'])
expect(cov.total === 4, 'total counts every fixture')
expect(cov.owned === 1 && cov.free === 1 && cov.missing === 1 && cov.unknown === 1, 'one of each state')
expect(cov.gaps.length === 1 && cov.gaps[0].shortName === 'Paramount+' && cov.gaps[0].games === 1, 'gap names Paramount+ once')

console.log('Share text')
const text = buildWeekText([epl, buli, fixture('done', 'epl', 'Premier League', 'final')], ['peacock'], { includeAccess: true })
expect(text.includes('Peacock (in your apps)'), 'share text marks owned games')
expect(text.includes('Fandango (free)'), 'share text marks free games')
expect(!text.includes('done'), 'share text skips finished games')
expect(!/\b1\s*[–-]\s*0\b/.test(text), 'share text never includes a score')
const plain = buildWeekText([epl], [], { includeAccess: false })
expect(!plain.includes('(not in your apps)'), 'includeAccess=false drops personal notes')

console.log('Rights map hygiene')
expect(/^\d{4}-\d{2}-\d{2}$/.test(RIGHTS_REVIEWED_ON), 'RIGHTS_REVIEWED_ON is a date')
const ids = new Set<DestinationId>()
for (const p of PROVIDERS) {
  expect(!ids.has(p.id), `provider id ${p.id} is unique`)
  ids.add(p.id)
  expect(p.url.startsWith('https://'), `${p.shortName} has an https url`)
}

console.log('Schedule changes between visits')
const before = snapshotWeek({}, [epl, ucl])
const moved = { ...epl, kickoffUtc: '2026-09-19T16:30:00Z' }
const postponed = { ...ucl, status: 'unknown' as const, statusDetail: 'Postponed' }
const diffs = diffWeek(before, [moved, postponed, buli])
expect(diffs.length === 2, 'one move and one postponement detected, new game ignored')
expect(diffs.some((d) => d.kind === 'moved' && d.fixtureId === 'epl-1' && d.from === epl.kickoffUtc), 'move keeps the old kickoff')
expect(diffs.some((d) => d.kind === 'postponed' && d.fixtureId === 'ucl-1'), 'postponement flagged from status detail')
expect(diffWeek(before, [{ ...epl, status: 'final', kickoffUtc: '2026-09-19T16:30:00Z' }]).length === 0, 'finished games never count as moved')
expect(mergeChanges(diffs, diffs).length === 2, 'merging the same changes twice does not duplicate')
const after = snapshotWeek(before, [moved])
expect(after['epl-1'].kickoffUtc === moved.kickoffUtc, 'snapshot updates to the new kickoff')
const old = snapshotWeek({ stale: { kickoffUtc: '2026-01-01T00:00:00Z', status: 'final' } }, [], new Date('2026-09-14T00:00:00Z'))
expect(!('stale' in old), 'snapshot drops entries older than two weeks')

console.log('Calendar file')
const ics = buildIcs([epl, buli], ['peacock'], 'My Week', new Date('2026-09-14T00:00:00Z'))
expect(ics.startsWith('BEGIN:VCALENDAR\r\n'), 'starts with VCALENDAR')
expect(ics.includes('UID:epl-1@sports-fan-planner'), 'UID is the stable fixture id')
expect(ics.includes('DTSTART:20260919T140000Z'), 'kickoff written in UTC')
expect(ics.includes('DURATION:PT2H'), 'two-hour duration')
expect(ics.includes('Peacock (in your apps)'), 'access note in description')
expect(ics.split('BEGIN:VEVENT').length - 1 === 2, 'one VEVENT per fixture')
expect(escapeIcs('a,b;c\nd') === 'a\\,b\\;c\\nd', 'escapes commas, semicolons, newlines')
expect(ics.split('\r\n').every((line) => line.length <= 75), 'no line exceeds 75 characters')

console.log('Last-good cache and merge precedence')
const seedLike = fixture('same-id', 'epl', 'Premier League')
const liveMoved = { ...seedLike, kickoffUtc: '2026-09-19T16:30:00Z' }
const win = favoritesComplete([liveMoved], ['ars'], new Date('2026-09-18T00:00:00Z'), new Date('2026-09-21T00:00:00Z'), [seedLike])
expect(win.fixtures.find((f) => f.id === 'same-id')?.kickoffUtc === liveMoved.kickoffUtc, 'live kickoff beats cached copy of the same game')
const offline = favoritesComplete([], ['ars'], new Date('2026-09-18T00:00:00Z'), new Date('2026-09-21T00:00:00Z'), [seedLike])
expect(offline.fixtures.some((f) => f.id === 'same-id'), 'cached fixtures fill the week when live is empty')

console.log('Seasons, lineups, shape')
expect(seasonFor('epl', '2026-09-19T14:00:00Z') === '2026-2027', 'September → 2026-2027 for European leagues')
expect(seasonFor('laliga', '2027-03-01T14:00:00Z') === '2026-2027', 'March → still 2026-2027')
expect(seasonFor('mls', '2026-09-19T14:00:00Z') === '2026', 'MLS uses the calendar year')
const raw = [
  { idPlayer: '1', strPlayer: 'Keeper', strPosition: 'Goalkeeper', strHome: 'Yes', strSubstitute: 'No', intSquadNumber: '1' },
  ...['2', '3', '4', '5'].map((n) => ({ idPlayer: n, strPlayer: `Def ${n}`, strPosition: 'Defender', strHome: 'Yes', strSubstitute: 'No', intSquadNumber: n })),
  ...['6', '7', '8'].map((n) => ({ idPlayer: n, strPlayer: `Mid ${n}`, strPosition: 'Midfielder', strHome: 'Yes', strSubstitute: 'No', intSquadNumber: n })),
  ...['9', '10', '11'].map((n) => ({ idPlayer: n, strPlayer: `Fwd ${n}`, strPosition: 'Forward', strHome: 'Yes', strSubstitute: 'No', intSquadNumber: n })),
  { idPlayer: '12', strPlayer: 'Sub', strPosition: 'Midfielder', strHome: 'Yes', strSubstitute: 'Yes', intSquadNumber: '12' },
  { idPlayer: '21', strPlayer: 'Away GK', strPosition: 'Goalkeeper', strHome: 'No', strSubstitute: 'No', intSquadNumber: '1' },
]
const grouped = groupLineup(raw)
expect(grouped.home.starters.length === 11 && grouped.home.bench.length === 1, 'home starters and bench split')
expect(grouped.home.shape === '4-3-3', 'shape counted as 4-3-3')
expect(grouped.home.starters[0].slot === 'GK', 'goalkeeper listed first')
expect(grouped.away.starters.length === 1 && grouped.away.shape === null, 'incomplete away eleven has no shape')
expect(shapeOf([]) === null, 'empty lineup has no shape')

console.log('Live scores')
const live = mapLive([
  { idEvent: 'epl-1', intHomeScore: '1', intAwayScore: '0', strStatus: '2H', strProgress: '67' },
  { idEvent: 'ucl-1', intHomeScore: '2', intAwayScore: '2', strStatus: 'FT', strProgress: '90' },
  { idEvent: 'other', intHomeScore: '0', intAwayScore: '0', strStatus: 'HT', strProgress: '45' },
  { intHomeScore: '9' },
])
expect(live.length === 3, 'entries without an event id are dropped')
expect(live[0].status === 'live' && live[0].statusDetail === "67'", 'second half maps to live with the minute')
expect(live[1].status === 'final' && live[1].statusDetail === 'FT', 'FT maps to final')
expect(live[2].statusDetail === 'HT', 'half time label')
const applied = applyLive([epl, ucl, buli], live)
expect(applied[0].homeScore === 1 && applied[0].status === 'live', 'live score overlays the fixture')
expect(applied[1].status === 'final' && applied[1].awayScore === 2, 'finished score overlays the fixture')
expect(applied[2] === buli, 'untouched fixture keeps identity')
const same = [epl]
expect(applyLive(same, []) === same, 'empty update returns the same array')
expect(anyInPlay([epl], new Date('2026-09-19T14:30:00Z')), 'thirty minutes after kickoff counts as in play')
expect(!anyInPlay([epl], new Date('2026-09-19T18:00:00Z')), 'four hours after kickoff does not')
expect(!anyInPlay([{ ...epl, status: 'final' }], new Date('2026-09-19T14:30:00Z')), 'finished games never poll')

if (failures) {
  console.log(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll access checks passed')
