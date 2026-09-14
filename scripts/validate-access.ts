/**
 * Checks the "My apps" labelling rules without a browser.
 * Run: npm run check:access
 */
import { accessFor, coverageFor, PROVIDERS, RIGHTS_REVIEWED_ON } from '../src/data/watch'
import type { DestinationId, Fixture, LeagueId } from '../src/domain/types'
import { buildWeekText } from '../src/lib/shareWeek'

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

if (failures) {
  console.log(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll access checks passed')
