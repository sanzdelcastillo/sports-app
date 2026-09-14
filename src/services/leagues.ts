import { allLeagues, dynamicLeagueId, getLeague, isDynamicLeagueId, leagueFromFeed, registerLeagues, shortLeagueName } from '../data/leagues'
import type { League, LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { getJson, V2 } from './theSportsDb'

const DIRECTORY_KEY = 'sfp.leagueDirectory.v1'
const DIRECTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface DirectoryEntry {
  id: string // feed id
  name: string
  alt?: string
}

interface Directory {
  leagues: DirectoryEntry[]
  fetchedAt: string
}

/** Demonyms the feed uses in league names → the country a fan would type. */
const DEMONYMS: Record<string, string> = {
  argentinian: 'argentina', argentine: 'argentina', brazilian: 'brazil', mexican: 'mexico', scottish: 'scotland',
  turkish: 'turkey türkiye', danish: 'denmark', dutch: 'netherlands holland', portuguese: 'portugal', belgian: 'belgium',
  swedish: 'sweden', norwegian: 'norway', swiss: 'switzerland', austrian: 'austria', greek: 'greece', russian: 'russia',
  ukrainian: 'ukraine', polish: 'poland', czech: 'czechia czech republic', croatian: 'croatia', serbian: 'serbia',
  japanese: 'japan', korean: 'korea', chinese: 'china', australian: 'australia', american: 'usa united states',
  canadian: 'canada', colombian: 'colombia', chilean: 'chile', peruvian: 'peru', uruguayan: 'uruguay',
  ecuadorian: 'ecuador', paraguayan: 'paraguay', bolivian: 'bolivia', venezuelan: 'venezuela', egyptian: 'egypt',
  moroccan: 'morocco', nigerian: 'nigeria', qatari: 'qatar', 'saudi-arabian': 'saudi arabia', 'saudi arabian': 'saudi arabia',
  indian: 'india', indonesian: 'indonesia', thai: 'thailand', irish: 'ireland', welsh: 'wales', english: 'england',
  spanish: 'spain', italian: 'italy', german: 'germany', french: 'france', finnish: 'finland', icelandic: 'iceland',
  romanian: 'romania', bulgarian: 'bulgaria', hungarian: 'hungary', slovak: 'slovakia', slovenian: 'slovenia',
  israeli: 'israel', emirati: 'uae united arab emirates', iranian: 'iran', 'south african': 'south africa',
  'costa rican': 'costa rica', honduran: 'honduras', guatemalan: 'guatemala', salvadoran: 'el salvador', panamanian: 'panama',
  jamaican: 'jamaica', cypriot: 'cyprus', maltese: 'malta', luxembourgish: 'luxembourg', kazakh: 'kazakhstan',
  azerbaijani: 'azerbaijan', georgian: 'georgia', armenian: 'armenia', vietnamese: 'vietnam', malaysian: 'malaysia',
  singaporean: 'singapore', 'new zealand': 'new zealand', algerian: 'algeria', tunisian: 'tunisia', ghanaian: 'ghana',
}

/** Feed ids of leagues worth surfacing before anyone types. */
export const POPULAR_LEAGUE_FEED_IDS = [
  '4350', '4351', '4406', '4668', '4330', '4339', '4329', '4338', '4344', '4337', '4340', '4429',
  '4347', '4394', '4400', '4401', '4403', '4407', '4359', '4355', '4356', '4346', '4357', '4396',
]

function searchText(entry: DirectoryEntry): string {
  const base = `${entry.name} ${entry.alt ?? ''}`.toLowerCase()
  const extras = Object.entries(DEMONYMS)
    .filter(([demonym]) => base.includes(demonym))
    .map(([, country]) => country)
  return `${base} ${extras.join(' ')}`
}

/** Every soccer league the feed knows (~700), from the device cache when fresh. */
export async function loadLeagueDirectory(): Promise<DirectoryEntry[]> {
  const cached = readJson<Directory | null>(DIRECTORY_KEY, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < DIRECTORY_TTL_MS) return cached.leagues
  try {
    const data = await getJson<{ all: { idLeague: string; strLeague: string; strSport: string; strLeagueAlternate?: string | null }[] | null }>(
      `${V2}/all/leagues`,
    )
    const leagues = (data.all ?? [])
      .filter((l) => l.strSport === 'Soccer' && l.idLeague && l.strLeague)
      .map<DirectoryEntry>((l) => ({ id: l.idLeague, name: l.strLeague, alt: l.strLeagueAlternate || undefined }))
    if (leagues.length === 0) return cached?.leagues ?? []
    writeJson<Directory>(DIRECTORY_KEY, { leagues, fetchedAt: new Date().toISOString() })
    return leagues
  } catch {
    return cached?.leagues ?? []
  }
}

export function searchLeagues(directory: DirectoryEntry[], query: string, limit = 40): DirectoryEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  return directory
    .filter((e) => {
      const text = searchText(e)
      return terms.every((t) => text.includes(t))
    })
    .sort((a, b) => {
      const pa = POPULAR_LEAGUE_FEED_IDS.indexOf(a.id)
      const pb = POPULAR_LEAGUE_FEED_IDS.indexOf(b.id)
      if ((pa === -1) !== (pb === -1)) return pa === -1 ? 1 : -1
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

export function popularLeagues(directory: DirectoryEntry[]): DirectoryEntry[] {
  const byId = new Map(directory.map((e) => [e.id, e]))
  return POPULAR_LEAGUE_FEED_IDS.map((id) => byId.get(id)).filter((e): e is DirectoryEntry => Boolean(e))
}

/** The app-side league for a directory entry — a known one when we map it by hand, otherwise registered from the feed. */
export function leagueForEntry(entry: DirectoryEntry): League {
  return leagueFromFeed(entry.id, entry.name)
}

export { allLeagues, dynamicLeagueId, getLeague, isDynamicLeagueId, registerLeagues, shortLeagueName }
export type { DirectoryEntry, LeagueId }
