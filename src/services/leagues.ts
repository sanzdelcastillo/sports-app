import { allLeagues, dynamicLeagueId, getLeague, isDynamicLeagueId, leagueFromProvider, registerLeagues, shortLeagueName } from '../data/leagues'
import type { League, LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { fetchLeagueDirectory } from './apiFootball'

const DIRECTORY_KEY = 'sfp.leagueDirectory.v2'
const DIRECTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface DirectoryEntry {
  id: string // provider id
  name: string
  country?: string
  type?: 'League' | 'Cup'
  season?: number | null
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

/** Provider ids of leagues worth surfacing before anyone types (Liga MX, Brasileirão, Argentina, Saudi, SPFL, Süper Lig, Championship, Belgium, Denmark, Sweden, Norway, Switzerland, Austria, Greece, J1, K League, A-League, Colombia, Chile, Uruguay, USL, Liga MX Femenil, NWSL, Serie B). */
export const POPULAR_LEAGUE_FEED_IDS = ['262', '71', '128', '307', '179', '203', '40', '144', '119', '113', '103', '207', '218', '197', '98', '292', '188', '239', '265', '268', '253', '255', '254', '136']

function searchText(entry: DirectoryEntry): string {
  const base = `${entry.name} ${entry.country ?? ''} ${entry.alt ?? ''}`.toLowerCase()
  const extras = Object.entries(DEMONYMS)
    .filter(([demonym]) => base.includes(demonym))
    .map(([, country]) => country)
  return `${base} ${extras.join(' ')}`
}

/** Every league the provider knows (~1,200, with country and current season), from the device cache when fresh. */
export async function loadLeagueDirectory(): Promise<DirectoryEntry[]> {
  const cached = readJson<Directory | null>(DIRECTORY_KEY, null)
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < DIRECTORY_TTL_MS) return cached.leagues
  try {
    const leagues = (await fetchLeagueDirectory())
      .filter((l) => !/\b(W|Women|U1\d|U2\d|Reserve|Youth)\b/i.test(l.name) || /NWSL|Femenil|WSL|Liga F/.test(l.name))
      .map<DirectoryEntry>((l) => ({ id: l.id, name: l.name, country: l.country, type: l.type, season: l.season }))
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

/** The app-side league for a directory entry — a known one when we map it by hand, otherwise registered from the provider. */
export function leagueForEntry(entry: DirectoryEntry): League {
  return leagueFromProvider(entry.id, entry.name, entry.country, entry.season ?? undefined)
}

export { allLeagues, dynamicLeagueId, getLeague, isDynamicLeagueId, registerLeagues, shortLeagueName }
export type { DirectoryEntry, LeagueId }
