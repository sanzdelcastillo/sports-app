import type { KnownLeagueId, League, LeagueId } from '../domain/types'

export const LEAGUES: Record<KnownLeagueId, League> = {
  mls: {
    id: 'mls',
    name: 'Major League Soccer',
    shortName: 'MLS',
    accent: '#FF6A00',
    providerId: '253',
    currentSeason: 2026,
  },
  epl: {
    id: 'epl',
    name: 'Premier League',
    shortName: 'EPL',
    accent: '#3D195B',
    providerId: '39',
    currentSeason: 2026,
  },
  laliga: {
    id: 'laliga',
    name: 'La Liga',
    shortName: 'La Liga',
    accent: '#EE4749',
    providerId: '140',
    currentSeason: 2026,
  },
  seriea: {
    id: 'seriea',
    name: 'Serie A',
    shortName: 'Serie A',
    accent: '#024494',
    providerId: '135',
    currentSeason: 2026,
  },
  ligue1: {
    id: 'ligue1',
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    accent: '#12233F',
    providerId: '61',
    currentSeason: 2026,
  },
  ucl: {
    id: 'ucl',
    name: 'UEFA Champions League',
    shortName: 'UCL',
    accent: '#1B2A6B',
    providerId: '2',
    currentSeason: 2026,
  },
  bundesliga: {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    accent: '#D20515',
    providerId: '78',
    currentSeason: 2026,
  },
  eredivisie: {
    id: 'eredivisie',
    name: 'Eredivisie',
    shortName: 'Eredivisie',
    accent: '#EE7812',
    providerId: '88',
    currentSeason: 2026,
  },
  primeira: {
    id: 'primeira',
    name: 'Primeira Liga',
    shortName: 'Liga Portugal',
    accent: '#006633',
    providerId: '94',
    currentSeason: 2026,
  },
  eflcup: { id: 'eflcup', name: 'EFL Cup', shortName: 'EFL Cup', accent: '#0A3D62', providerId: '48', currentSeason: 2026 },
  facup: { id: 'facup', name: 'FA Cup', shortName: 'FA Cup', accent: '#B4172D', providerId: '45', currentSeason: 2026 },
  communityshield: { id: 'communityshield', name: 'Community Shield', shortName: 'Comm. Shield', accent: '#B4172D', providerId: '528', currentSeason: 2026 },
  uel: { id: 'uel', name: 'UEFA Europa League', shortName: 'UEL', accent: '#F58220', providerId: '3', currentSeason: 2026 },
  uecl: { id: 'uecl', name: 'UEFA Conference League', shortName: 'UECL', accent: '#2F7D32', providerId: '848', currentSeason: 2026 },
  uefasupercup: { id: 'uefasupercup', name: 'UEFA Super Cup', shortName: 'Super Cup', accent: '#1B2A6B', providerId: '531', currentSeason: 2026 },
  copadelrey: { id: 'copadelrey', name: 'Copa del Rey', shortName: 'Copa del Rey', accent: '#C8102E', providerId: '143', currentSeason: 2026 },
  supercopa: { id: 'supercopa', name: 'Supercopa de España', shortName: 'Supercopa', accent: '#C8102E', providerId: '556', currentSeason: 2026 },
  coppaitalia: { id: 'coppaitalia', name: 'Coppa Italia', shortName: 'Coppa Italia', accent: '#024494', providerId: '137', currentSeason: 2026 },
  supercoppa: { id: 'supercoppa', name: 'Supercoppa Italiana', shortName: 'Supercoppa', accent: '#024494', providerId: '547', currentSeason: 2025 },
  dfbpokal: { id: 'dfbpokal', name: 'DFB-Pokal', shortName: 'DFB-Pokal', accent: '#000000', providerId: '81', currentSeason: 2026 },
  leaguescup: { id: 'leaguescup', name: 'Leagues Cup', shortName: 'Leagues Cup', accent: '#FF6A00', providerId: '772', currentSeason: 2026 },
  usopencup: { id: 'usopencup', name: 'U.S. Open Cup', shortName: 'Open Cup', accent: '#0B3D91', providerId: '257', currentSeason: 2026 },
  // More leagues with U.S. rights worth mapping by hand
  ligamx: { id: 'ligamx', name: 'Liga MX', shortName: 'Liga MX', accent: '#0B7A3B', providerId: '262', currentSeason: 2026 },
  brasileirao: { id: 'brasileirao', name: 'Brasileirão Série A', shortName: 'Brasileirão', accent: '#0A7C3E', providerId: '71', currentSeason: 2026 },
  spfl: { id: 'spfl', name: 'Scottish Premiership', shortName: 'SPFL', accent: '#1B3F8B', providerId: '179', currentSeason: 2026 },
  superlig: { id: 'superlig', name: 'Turkish Süper Lig', shortName: 'Süper Lig', accent: '#C8102E', providerId: '203', currentSeason: 2026 },
  argprimera: { id: 'argprimera', name: 'Argentine Primera División', shortName: 'Primera', accent: '#6CACE4', providerId: '128', currentSeason: 2026 },
  saudipro: { id: 'saudipro', name: 'Saudi Pro League', shortName: 'Saudi Pro', accent: '#1C7A3C', providerId: '307', currentSeason: 2026 },
  // National-team and continental tournaments
  worldcup: { id: 'worldcup', name: 'FIFA World Cup', shortName: 'World Cup', accent: '#1B2A6B', providerId: '1', currentSeason: 2026 },
  euros: { id: 'euros', name: 'UEFA European Championship', shortName: 'Euros', accent: '#0E4C92', providerId: '4', currentSeason: 2024 },
  copaamerica: { id: 'copaamerica', name: 'Copa América', shortName: 'Copa América', accent: '#C8102E', providerId: '9', currentSeason: 2024 },
  goldcup: { id: 'goldcup', name: 'CONCACAF Gold Cup', shortName: 'Gold Cup', accent: '#B8860B', providerId: '22', currentSeason: 2025 },
  uefanations: { id: 'uefanations', name: 'UEFA Nations League', shortName: 'Nations League', accent: '#0E4C92', providerId: '5', currentSeason: 2026 },
  concacafnations: { id: 'concacafnations', name: 'CONCACAF Nations League', shortName: 'CNL', accent: '#0B3D91', providerId: '536', currentSeason: 2024 },
  clubworldcup: { id: 'clubworldcup', name: 'FIFA Club World Cup', shortName: 'Club World Cup', accent: '#1B2A6B', providerId: '15', currentSeason: 2025 },
  libertadores: { id: 'libertadores', name: 'Copa Libertadores', shortName: 'Libertadores', accent: '#A6192E', providerId: '13', currentSeason: 2026 },
  concacafcc: { id: 'concacafcc', name: 'CONCACAF Champions Cup', shortName: 'CCC', accent: '#0B3D91', providerId: '16', currentSeason: 2026 },
  wcqconcacaf: { id: 'wcqconcacaf', name: 'World Cup Qualifying · CONCACAF', shortName: 'WCQ CONCACAF', accent: '#0B3D91', providerId: '31', currentSeason: 2026 },
  wcqconmebol: { id: 'wcqconmebol', name: 'World Cup Qualifying · CONMEBOL', shortName: 'WCQ CONMEBOL', accent: '#A6192E', providerId: '34', currentSeason: 2026 },
  wcquefa: { id: 'wcquefa', name: 'World Cup Qualifying · UEFA', shortName: 'WCQ UEFA', accent: '#0E4C92', providerId: '32', currentSeason: 2024 },
  other: {
    id: 'other',
    name: 'Soccer',
    shortName: 'Soccer',
    accent: '#007BFF',
  },
}

const PROVIDER_LEAGUE: Record<string, LeagueId> = {
  '39': 'epl',
  '140': 'laliga',
  '135': 'seriea',
  '78': 'bundesliga',
  '61': 'ligue1',
  '253': 'mls',
  '88': 'eredivisie',
  '94': 'primeira',
  '2': 'ucl',
  '3': 'uel',
  '848': 'uecl',
  '45': 'facup',
  '48': 'eflcup',
  '528': 'communityshield',
  '143': 'copadelrey',
  '556': 'supercopa',
  '137': 'coppaitalia',
  '547': 'supercoppa',
  '81': 'dfbpokal',
  '772': 'leaguescup',
  '257': 'usopencup',
  '1': 'worldcup',
  '4': 'euros',
  '9': 'copaamerica',
  '22': 'goldcup',
  '5': 'uefanations',
  '536': 'concacafnations',
  '15': 'clubworldcup',
  '13': 'libertadores',
  '16': 'concacafcc',
  '531': 'uefasupercup',
  '31': 'wcqconcacaf',
  '34': 'wcqconmebol',
  '32': 'wcquefa',
  '262': 'ligamx',
  '71': 'brasileirao',
  '179': 'spfl',
  '203': 'superlig',
  '128': 'argprimera',
  '307': 'saudipro',
}

/* ---------- Dynamic league registry (feed leagues beyond the hand-mapped set) ---------- */

const REGISTRY_KEY = 'sfp.leagueRegistry.v1'
const dynamic = new Map<string, League>()
const dynamicByProviderId = new Map<string, League>()
let leagueVersion = 0
let leaguesRestored = false

const ACCENTS = ['#0E3C29', '#1B2A6B', '#B64132', '#0B3D91', '#6B2D5C', '#8A5A00', '#2F6B4F', '#4A4A8A']

export function dynamicLeagueId(providerId: string): string {
  return `l${providerId}`
}

export function isDynamicLeagueId(id: string): boolean {
  return /^l\d+$/.test(id)
}

export function shortLeagueName(name: string): string {
  const cleaned = name
    .replace(/^(Argentinian|Argentine|Brazilian|Mexican|Scottish|Turkish|Danish|Dutch|Portuguese|Belgian|Swedish|Norwegian|Swiss|Austrian|Greek|Russian|Ukrainian|Polish|Czech|Croatian|Serbian|Japanese|Korean|Chinese|Australian|American|Canadian|Colombian|Chilean|Peruvian|Uruguayan|Ecuadorian|Paraguayan|Bolivian|Venezuelan|Egyptian|Moroccan|South African|Nigerian|Qatari|Saudi Arabian|Indian|Indonesian|Thai|Irish|Welsh|Northern Irish|English|Spanish|Italian|German|French)\s+/i, '')
    .trim()
  return cleaned.length > 16 ? cleaned.slice(0, 15).trim() + '…' : cleaned || name
}

export function registerLeagues(leagues: League[]): void {
  let changed = false
  for (const l of leagues) {
    if (!l.providerId || PROVIDER_LEAGUE[l.providerId]) continue
    const existing = dynamicByProviderId.get(l.providerId)
    if (existing && existing.name === l.name && existing.currentSeason === l.currentSeason && existing.country === l.country) continue
    const merged: League = { ...existing, ...l, id: existing?.id ?? l.id }
    dynamic.set(merged.id, merged)
    dynamicByProviderId.set(merged.providerId!, merged)
    changed = true
  }
  if (changed) {
    leagueVersion += 1
    persistLeagues()
  }
}

function persistLeagues(): void {
  if (!leaguesRestored || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify([...dynamic.values()].slice(-800)))
  } catch {
    /* ignore */
  }
}

export function restoreLeagues(): void {
  if (leaguesRestored) return
  if (typeof localStorage === 'undefined') {
    leaguesRestored = true
    return
  }
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    const list = raw ? (JSON.parse(raw) as League[]) : []
    if (Array.isArray(list)) registerLeagues(list.filter((l) => l && typeof l.id === 'string' && l.providerId))
  } catch {
    /* ignore */
  } finally {
    leaguesRestored = true
  }
}

export function leagueRegistryVersion(): number {
  return leagueVersion
}

/** A league from the provider, registered on sight so fixtures from any league render with a real name. */
export function leagueFromProvider(providerId: string, name: string, country?: string, currentSeason?: number): League {
  const known = PROVIDER_LEAGUE[providerId]
  if (known) return LEAGUES[known as KnownLeagueId]
  const existing = dynamicByProviderId.get(providerId)
  if (existing && (currentSeason === undefined || existing.currentSeason === currentSeason)) return existing
  const league: League = {
    id: dynamicLeagueId(providerId),
    name,
    shortName: shortLeagueName(name),
    accent: ACCENTS[Number(providerId) % ACCENTS.length],
    providerId,
    country: country ?? existing?.country,
    currentSeason: currentSeason ?? existing?.currentSeason,
  }
  registerLeagues([league])
  return league
}

/** Display name for dynamic leagues: "Serie A" is ambiguous without "Brazil". */
export function leagueDisplayName(l: League): string {
  return l.country && l.country !== 'World' && !l.name.toLowerCase().includes(l.country.toLowerCase()) ? `${l.name} · ${l.country}` : l.name
}

/** Any league by app id — static, dynamic, or a safe placeholder. Never undefined. */
export function getLeague(id: LeagueId): League {
  const known = (LEAGUES as Record<string, League>)[id]
  if (known) return known
  const dyn = dynamic.get(id)
  if (dyn) return dyn
  return { id, name: 'Soccer', shortName: 'Soccer', accent: '#007BFF' }
}

export function allLeagues(): League[] {
  return [...Object.values(LEAGUES), ...dynamic.values()]
}

export function leagueFromProviderId(providerId?: string | null, name?: string | null, country?: string | null): LeagueId {
  if (providerId && PROVIDER_LEAGUE[providerId]) return PROVIDER_LEAGUE[providerId]
  if (providerId && name) return leagueFromProvider(providerId, name, country ?? undefined).id
  if (providerId) {
    const dyn = dynamicByProviderId.get(providerId)
    if (dyn) return dyn.id
  }
  return 'other'
}

/** Competitions a fan can follow as a whole. Order is display order. */
export const FOLLOWABLE_COMPETITIONS: { group: string; ids: LeagueId[] }[] = [
  { group: 'Continental', ids: ['ucl', 'uel', 'uecl', 'libertadores', 'concacafcc'] },
  { group: 'National teams', ids: ['worldcup', 'euros', 'copaamerica', 'goldcup', 'uefanations', 'concacafnations', 'wcqconcacaf', 'wcqconmebol', 'wcquefa'] },
  { group: 'Cups', ids: ['clubworldcup', 'facup', 'eflcup', 'copadelrey', 'coppaitalia', 'dfbpokal', 'leaguescup', 'usopencup'] },
  { group: 'Every game in a league', ids: ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'mls', 'eredivisie', 'primeira'] },
]

export const LEAGUE_FOLLOW_PREFIX = 'league:'

export function leagueFollowId(id: LeagueId): string {
  return `${LEAGUE_FOLLOW_PREFIX}${id}`
}

export function leagueIdFromFollow(followId: string): LeagueId | null {
  if (!followId.startsWith(LEAGUE_FOLLOW_PREFIX)) return null
  const id = followId.slice(LEAGUE_FOLLOW_PREFIX.length)
  return id in LEAGUES || isDynamicLeagueId(id) ? id : null
}
