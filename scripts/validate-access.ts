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
import { groupLineup, languageOf, mapTv, seasonFor, shapeOf } from '../src/services/matchExtras'
import { mapClub } from '../src/services/clubs'
import { mapEvent } from '../src/services/theSportsDb'
import { involvesTeam } from '../src/lib/status'
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

console.log('Feed timestamps and unknown opponents')
const cupTie = mapEvent({
  idEvent: '999001', strTimestamp: '2026-09-15T19:00:00', dateEvent: '2026-09-15', strTime: '19:00:00',
  idHomeTeam: '133622', strHomeTeam: 'Ipswich Town', idAwayTeam: '133604', strAwayTeam: 'Arsenal',
  idLeague: '4570', strLeague: 'EFL Cup', strStatus: 'Not Started',
} as never)
expect(cupTie?.kickoffUtc === '2026-09-15T19:00:00.000Z', 'zone-less feed timestamp is read as UTC, not local')
expect(cupTie?.leagueId === 'eflcup', 'EFL Cup recognised')
expect(getTeam(cupTie?.homeTeamId ?? '')?.name === 'Ipswich Town', 'opponent unknown to the app gets a real record from the event')
expect(getTeam(cupTie?.awayTeamId ?? '')?.id === 'ars', 'known club keeps its core id')

console.log('Competition follows')
const uclGame = { ...cupTie!, leagueId: 'ucl' as const, homeTeamId: 't1', awayTeamId: 't2' }
expect(involvesTeam(uclGame, 'league:ucl') && !involvesTeam(uclGame, 'league:uel'), 'a followed competition covers its games')
expect(!involvesTeam(uclGame, 'ars'), 'club follow still needs the club on the pitch')
expect(leagueIdFromFollow('league:worldcup') === 'worldcup' && leagueIdFromFollow('ars') === null, 'follow ids parse')

console.log('Any league')
const dir = [
  { id: '4406', name: 'Argentinian Primera Division' },
  { id: '4340', name: 'Danish Superliga' },
  { id: '4668', name: 'Saudi-Arabian Pro League' },
  { id: '5215', name: 'Argentina Primera B Metropolitana' },
]
expect(searchLeagues(dir, 'denmark').some((e) => e.id === '4340'), 'country name finds a league named by demonym')
expect(searchLeagues(dir, 'saudi').some((e) => e.id === '4668'), 'partial country search')
expect(searchLeagues(dir, 'argentina').length === 2, 'both Argentine leagues match')
const danish = leagueForEntry(dir[1])
expect(danish.id === 'l4340' && danish.shortName === 'Superliga', 'unmapped league registered from the feed with a short name')
expect(getLeague('l4340').name === 'Danish Superliga' && getLeague('nope').name === 'Soccer', 'getLeague resolves dynamic ids and never returns undefined')
expect(leagueIdFromFollow('league:l4340') === 'l4340', 'dynamic league follows parse')
const danishGame = mapEvent({
  idEvent: '999002', strTimestamp: '2026-09-20T17:00:00', dateEvent: '2026-09-20', strTime: '17:00:00',
  idHomeTeam: '900001', strHomeTeam: 'FC Copenhagen', idAwayTeam: '900002', strAwayTeam: 'Brøndby',
  idLeague: '4340', strLeague: 'Danish Superliga', strStatus: 'Not Started',
} as never)
expect(danishGame?.leagueId === 'l4340' && danishGame.leagueName === 'Danish Superliga', 'a game from any league carries its real league')
expect(accessFor(danishGame!, ['peacock']).state === 'unknown', 'no U.S. rights guess for an unmapped league')

console.log('News parsing')
const rss = `<rss><channel><item><title><![CDATA[Arsenal &amp; Chelsea draw]]></title><link>https://x.test/a</link><pubDate>Mon, 14 Sep 2026 11:25:35 GMT</pubDate></item><item><title>No link</title></item></channel></rss>`
const parsed = parseRss(rss, 'Test')
expect(parsed.length === 1 && parsed[0].title === 'Arsenal & Chelsea draw' && parsed[0].publishedAt?.startsWith('2026-09-14'), 'RSS items parse; items without links dropped')
expect(isForYou(parsed[0], followKeywords(['ars'])) && !isForYou(parsed[0], followKeywords(['liv'])), 'headline matching by followed club')

console.log('TV listings and language')
const tv = mapTv([
  { strCountry: 'United States', strChannel: 'Peacock', strTime: '14:00:00' },
  { strCountry: 'United States', strChannel: 'Telemundo' },
  { strCountry: 'United Kingdom', strChannel: 'Sky Sports' },
  { strCountry: 'USA', strChannel: 'peacock' },
])
expect(tv.length === 2, 'only U.S. listings kept, duplicates by channel collapsed')
expect(tv.find((l) => l.channel === 'Telemundo')?.language === 'es', 'Telemundo tagged Spanish')
expect(languageOf('ESPN Deportes') === 'es' && languageOf('CBS Sports Network') === 'en', 'language heuristic')

console.log('Club catalogue')
const club = mapClub({ idTeam: '133600', strTeam: 'Fulham', strTeamShort: 'FUL', strBadge: 'https://x/badge.png', strCountry: 'England' }, 'epl')
expect(club?.id === 't133600' && club.shortName === 'FUL', 'feed-only club gets a stable id and short name')
const known = mapClub({ idTeam: '133604', strTeam: 'Arsenal', strTeamShort: 'ARS' }, 'epl')
expect(known?.id === 'ars', 'a club already in the core keeps its core id')
expect(mapClub({ idTeam: '1', strTeam: 'Real Salt Lake' }, 'mls')?.shortName === 'RSL', 'short name derived from initials when missing')

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
