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
import { anyInPlay, applyLive, type LiveUpdate } from '../src/services/livescores'
import { mapLineups, mapStandings, seasonFor, shapeOf } from '../src/services/matchExtras'
import { mapFixture, statusOf, teamFromProvider } from '../src/services/apiFootball'
import { involvesTeam, scoreLabel } from '../src/lib/status'
import { liveClockLabel } from '../src/components/LiveClock'
import { mapEvents, mapStats } from '../src/services/matchExtras'
import { getLeague, leagueIdFromFollow } from '../src/data/leagues'
import { leagueForEntry, searchLeagues } from '../src/services/leagues'
import { followKeywords, isForYou } from '../src/services/news'
// @ts-expect-error plain JS function module
import { parseRss } from '../api/news.js'
import { getTeam } from '../src/data/teams'
import { decodeSetup, encodeSetup } from '../src/lib/setupCode'

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
expect(ics.includes('UID:epl-1@pitchside.app'), 'UID is the stable fixture id')
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
expect(seasonFor('epl', '2026-09-19T14:00:00Z') === '2026', 'mapped leagues use the provider season')
expect(seasonFor('mls', '2026-09-19T14:00:00Z') === '2026', 'MLS uses the calendar year')
console.log('Live scores')
const live: LiveUpdate[] = [
  { fixtureId: 'epl-1', homeScore: 1, awayScore: 0, status: 'live', statusDetail: "67'", liveMinute: 67, livePeriod: '2H' },
  { fixtureId: 'ucl-1', homeScore: 2, awayScore: 2, status: 'final', statusDetail: 'FT' },
  { fixtureId: 'other', homeScore: 0, awayScore: 0, status: 'live', statusDetail: 'HT', livePeriod: 'HT' },
]
const applied = applyLive([epl, ucl, buli], live)
expect(applied[0].homeScore === 1 && applied[0].status === 'live', 'live score overlays the fixture')
expect(applied[1].status === 'final' && applied[1].awayScore === 2, 'finished score overlays the fixture')
expect(applied[2] === buli, 'untouched fixture keeps identity')
const same = [epl]
expect(applyLive(same, []) === same, 'empty update returns the same array')
expect(anyInPlay([epl], new Date('2026-09-19T14:30:00Z')), 'thirty minutes after kickoff counts as in play')
expect(!anyInPlay([epl], new Date('2026-09-19T18:00:00Z')), 'four hours after kickoff does not')
expect(!anyInPlay([{ ...epl, status: 'final' }], new Date('2026-09-19T14:30:00Z')), 'finished games never poll')

console.log('Provider fixtures and unknown opponents')
const cupTie = mapFixture({
  fixture: { id: 999001, date: '2026-09-15T19:00:00+00:00', status: { long: 'Not Started', short: 'NS', elapsed: null }, venue: { id: 1, name: 'Portman Road', city: 'Ipswich' } },
  league: { id: 48, name: 'League Cup', country: 'England', season: 2026, round: 'Round of 32' },
  teams: { home: { id: 57, name: 'Ipswich' }, away: { id: 42, name: 'Arsenal' } },
  goals: { home: null, away: null },
})
expect(cupTie?.kickoffUtc === '2026-09-15T19:00:00.000Z', 'provider timestamps are read as UTC')
expect(cupTie?.leagueId === 'eflcup' && cupTie.leagueName === 'EFL Cup', 'League Cup recognised as EFL Cup')
expect(getTeam(cupTie?.awayTeamId ?? '')?.id === 'ars', 'known club keeps its core id')
expect(getTeam(cupTie?.homeTeamId ?? '')?.id === 'ips' && cupTie?.round === 'Round of 32', 'core club by provider id; round kept')
const stranger = mapFixture({
  fixture: { id: 999003, date: '2026-09-20T17:00:00+00:00', status: { long: 'Not Started', short: 'NS', elapsed: null } },
  league: { id: 119, name: 'Superliga', country: 'Denmark', season: 2026 },
  teams: { home: { id: 400, name: 'FC Copenhagen', logo: 'https://x/400.png' }, away: { id: 401, name: 'Brøndby' } },
  goals: { home: null, away: null },
})
expect(stranger?.leagueId === 'l119' && getTeam(stranger.homeTeamId)?.name === 'FC Copenhagen' && getTeam(stranger.homeTeamId)?.badgeUrl === 'https://x/400.png', 'a game from any league creates clubs and league on sight')
expect(accessFor(stranger!, ['peacock']).state === 'unknown', 'no U.S. rights guess for an unmapped league')
expect(statusOf('2H') === 'live' && statusOf('AET') === 'final' && statusOf('PST') === 'postponed' && statusOf('NS') === 'scheduled', 'status codes map')
const liveRaw = mapFixture({
  fixture: { id: 999004, date: '2026-09-14T16:30:00+00:00', status: { long: 'Second Half', short: '2H', elapsed: 54, extra: null } },
  league: { id: 135, name: 'Serie A', country: 'Italy', season: 2026 },
  teams: { home: { id: 895, name: 'Como' }, away: { id: 523, name: 'Parma' } },
  goals: { home: 1, away: 0 },
})
expect(liveRaw?.status === 'live' && liveRaw.liveMinute === 54 && liveRaw.livePeriod === '2H' && liveRaw.statusDetail === "54'", 'live minute and period carried')

console.log('Competition follows')
const uclGame = { ...cupTie!, leagueId: 'ucl' as const, homeTeamId: 't1', awayTeamId: 't2' }
expect(involvesTeam(uclGame, 'league:ucl') && !involvesTeam(uclGame, 'league:uel'), 'a followed competition covers its games')
expect(!involvesTeam(uclGame, 'ars'), 'club follow still needs the club on the pitch')
expect(leagueIdFromFollow('league:worldcup') === 'worldcup' && leagueIdFromFollow('ars') === null, 'follow ids parse')

console.log('Any league')
const dir = [
  { id: '128', name: 'Liga Profesional Argentina', country: 'Argentina', type: 'League' as const, season: 2026 },
  { id: '119', name: 'Superliga', country: 'Denmark', type: 'League' as const, season: 2026 },
  { id: '307', name: 'Pro League', country: 'Saudi-Arabia', type: 'League' as const, season: 2026 },
  { id: '129', name: 'Primera B Nacional', country: 'Argentina', type: 'League' as const, season: 2026 },
]
expect(searchLeagues(dir, 'denmark').some((e) => e.id === '119'), 'country name finds a league')
expect(searchLeagues(dir, 'saudi').some((e) => e.id === '307'), 'partial country search')
expect(searchLeagues(dir, 'argentina').length === 2, 'both Argentine leagues match')
const danish = leagueForEntry(dir[1])
expect(danish.id === 'l119' && danish.currentSeason === 2026 && danish.country === 'Denmark', 'unmapped league registered from the provider with season and country')
expect(getLeague('l119').name === 'Superliga' && getLeague('nope').name === 'Soccer', 'getLeague resolves dynamic ids and never returns undefined')
expect(leagueIdFromFollow('league:l119') === 'l119', 'dynamic league follows parse')

console.log('Live clock, scores and match report')
expect(scoreLabel(null, 'live') === '0' && scoreLabel(null, 'final') === '—' && scoreLabel(null, 'scheduled') === '—', 'live with no score reads 0; unknown finals stay blank')
const liveFx = { ...cupTie!, status: 'live' as const, liveMinute: 23, livePeriod: '1H', liveMinuteAt: new Date(Date.now() - 95_000).toISOString() }
expect(liveClockLabel(liveFx).text === '24:35', 'clock counts seconds between feed updates')
expect(liveClockLabel({ ...liveFx, liveMinute: 44, liveMinuteAt: new Date(Date.now() - 130_000).toISOString() }).text === "45+1'", 'clock stops at the end of the half and shows added time')
expect(liveClockLabel({ ...liveFx, livePeriod: 'HT' }).text === 'HT', 'half time')
const ev = mapEvents([
  { time: { elapsed: 58, extra: null }, team: { id: 42, name: 'Arsenal' }, player: { id: 1, name: 'Bruno' }, assist: { id: 2, name: 'Rice' }, type: 'Goal', detail: 'Normal Goal' },
  { time: { elapsed: 28, extra: null }, team: { id: 57, name: 'Ipswich' }, player: { id: 3, name: 'Reinildo' }, assist: { id: null, name: null }, type: 'Card', detail: 'Yellow Card', comments: 'Foul' },
  { time: { elapsed: 45, extra: 2 }, team: { id: 42, name: 'Arsenal' }, player: { id: 4, name: 'White' }, assist: { id: 5, name: 'Timber' }, type: 'subst', detail: 'Substitution 1' },
], '57')
expect(ev.map((e) => e.kind).join(',') === 'yellow,sub,goal', 'events sorted by minute with kinds')
expect(ev[2].side === 'away' && ev[2].detail === 'assist Rice' && ev[1].detail === 'for Timber' && ev[1].extra === 2, 'sides, details and added time')
const st = mapStats([
  { team: { id: 57, name: 'Ipswich' }, statistics: [{ type: 'Shots on Goal', value: 3 }, { type: 'Ball Possession', value: '38%' }, { type: 'expected_goals', value: '0.8' }] },
  { team: { id: 42, name: 'Arsenal' }, statistics: [{ type: 'Shots on Goal', value: 5 }, { type: 'Ball Possession', value: '62%' }, { type: 'expected_goals', value: '2.1' }] },
], '57')
expect(st[0].label === 'Ball Possession' && st[0].percent && st[0].away === 62 && st[1].label.includes('xG'), 'possession first, percent parsed, xG labelled')

console.log('Lineups and standings')
const lu = mapLineups([
  { team: { id: 57, name: 'Ipswich' }, coach: { id: 1, name: 'K. McKenna' }, formation: '4-2-3-1', startXI: [{ player: { id: 10, name: 'A. Palmer', number: 1, pos: 'G', grid: '1:1' } }, { player: { id: 11, name: 'L. Davis', number: 3, pos: 'D', grid: '2:1' } }], substitutes: [{ player: { id: 12, name: 'C. Walton', number: 28, pos: 'G', grid: null } }] },
  { team: { id: 42, name: 'Arsenal' }, coach: { id: 2, name: 'M. Arteta' }, formation: '4-3-3', startXI: [], substitutes: [] },
], '57')
expect(lu.home.shape === '4-2-3-1' && lu.home.coach === 'K. McKenna' && lu.home.starters[0].row === 1 && lu.home.starters[0].cutoutUrl?.includes('/players/10'), 'lineup with formation, coach, grid and photo')
expect(lu.home.bench.length === 1 && lu.home.bench[0].slot === 'SUB' && lu.away.starters.length === 0, 'bench and empty side')
expect(shapeOf([{ id: 'a', name: 'x', number: 1, slot: 'GK', row: 1 }, { id: 'b', name: 'y', number: 2, slot: 'DEF', row: 2 }, { id: 'c', name: 'z', number: 3, slot: 'DEF', row: 2 }]) === '2', 'shape counted from rows when no formation string')
const rows = mapStandings([{ league: { id: 135, season: 2026, standings: [[{ rank: 1, team: { id: 487, name: 'Lazio', logo: null }, points: 10, goalsDiff: 5, form: 'DWWW', all: { played: 4, win: 3, draw: 1, lose: 0 } }]] } }])
expect(rows.length === 1 && rows[0].form === 'DWWW' && rows[0].teamProviderId === '487', 'standings mapped')
expect(seasonFor('epl', '2026-09-14T00:00:00Z') === '2026' && seasonFor('l9999', '2026-03-01T00:00:00Z') === '2025', 'season from the provider or a July cut-over guess')
teamFromProvider({ id: 5000, name: 'Real Salt Lake', code: null }, 'mls')
expect(getTeam('t5000')?.shortName === 'RSL', 'short code from initials when the provider has none')

console.log('Setup code')
const setup = { follows: ['ars', 't133600'], subscribed: ['peacock' as const], watchLater: ['x1'], hideScores: true }
const code = encodeSetup(setup)
expect(code.startsWith('PS1.') && !code.includes('+') && !code.includes('/'), 'code is prefixed and URL-safe')
const back = decodeSetup(code)
expect(JSON.stringify(back) === JSON.stringify(setup), 'setup survives a round trip')
expect(decodeSetup('garbage') === null && decodeSetup('PS1.@@@') === null, 'bad codes are rejected')
expect(decodeSetup(encodeSetup({ ...setup, subscribed: ['nope' as never] }))?.subscribed.length === 0, 'unknown apps are dropped on restore')

if (failures) {
  console.log(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll access checks passed')
