import type { Team } from '../domain/types'

function espnCrest(espnId: string): string {
  return `https://a.espncdn.com/i/teamlogos/soccer/500/${espnId}.png`
}

export const TEAMS: Team[] = [
  {
    id: 'mia',
    name: 'Inter Miami',
    shortName: 'MIA',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Chase Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/m4it3e1602103647.png',
    espnLogoUrl: espnCrest('20232'),
    espnId: '20232',
    providerId: '9568',
    color: '#F7B5CD',
    colorSecondary: '#231F20',
    followable: true,
  },
  {
    id: 'la',
    name: 'LA Galaxy',
    shortName: 'LA',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Dignity Health Sports Park',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/ysyysr1420227188.png',
    espnLogoUrl: espnCrest('187'),
    espnId: '187',
    providerId: '1605',
    color: '#00245D',
    colorSecondary: '#FFD200',
    followable: true,
  },
  {
    id: 'rma',
    name: 'Real Madrid',
    shortName: 'RMA',
    leagueId: 'laliga',
    country: 'Spain',
    stadium: 'Santiago Bernabéu',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png',
    espnLogoUrl: espnCrest('86'),
    espnId: '86',
    providerId: '541',
    color: '#FFFFFF',
    colorSecondary: '#00529F',
    followable: true,
  },
  {
    id: 'atm',
    name: 'Atlético Madrid',
    shortName: 'ATM',
    leagueId: 'laliga',
    country: 'Spain',
    stadium: 'Riyadh Air Metropolitano',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png',
    espnLogoUrl: espnCrest('1068'),
    espnId: '1068',
    providerId: '530',
    color: '#CB3524',
    colorSecondary: '#272E61',
    followable: true,
  },
  {
    id: 'bar',
    name: 'Barcelona',
    shortName: 'BAR',
    leagueId: 'laliga',
    country: 'Spain',
    stadium: 'Spotify Camp Nou',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png',
    espnLogoUrl: espnCrest('83'),
    espnId: '83',
    providerId: '529',
    color: '#004D98',
    colorSecondary: '#A50044',
    followable: true,
  },
  {
    id: 'mci',
    name: 'Manchester City',
    shortName: 'MCI',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Etihad Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png',
    espnLogoUrl: espnCrest('382'),
    espnId: '382',
    providerId: '50',
    color: '#6CABDD',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'mun',
    name: 'Manchester United',
    shortName: 'MUN',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Old Trafford',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png',
    espnLogoUrl: espnCrest('360'),
    espnId: '360',
    providerId: '33',
    color: '#DA291C',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'liv',
    name: 'Liverpool',
    shortName: 'LIV',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Anfield',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png',
    espnLogoUrl: espnCrest('364'),
    espnId: '364',
    providerId: '40',
    color: '#C8102E',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'ars',
    name: 'Arsenal',
    shortName: 'ARS',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Emirates Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
    espnLogoUrl: espnCrest('359'),
    espnId: '359',
    providerId: '42',
    color: '#EF0107',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    leagueId: 'ligue1',
    country: 'France',
    stadium: 'Parc des Princes',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png',
    espnLogoUrl: espnCrest('160'),
    espnId: '160',
    providerId: '85',
    color: '#004170',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'int',
    name: 'Inter Milan',
    shortName: 'INT',
    leagueId: 'seriea',
    country: 'Italy',
    stadium: 'San Siro',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png',
    espnLogoUrl: espnCrest('110'),
    espnId: '110',
    providerId: '505',
    color: '#010E80',
    colorSecondary: '#000000',
    followable: true,
  },
  {
    id: 'che',
    name: 'Chelsea',
    shortName: 'CHE',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Stamford Bridge',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/pbf4ul1782638263.png',
    espnLogoUrl: espnCrest('363'),
    espnId: '363',
    providerId: '49',
    color: '#034694',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'tot',
    name: 'Tottenham',
    shortName: 'TOT',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Tottenham Hotspur Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/44untz1518467380.png',
    espnLogoUrl: espnCrest('367'),
    espnId: '367',
    providerId: '47',
    color: '#132257',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'bay',
    name: 'Bayern Munich',
    shortName: 'BAY',
    leagueId: 'bundesliga',
    country: 'Germany',
    stadium: 'Allianz Arena',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png',
    espnLogoUrl: espnCrest('132'),
    espnId: '132',
    providerId: '157',
    color: '#DC052D',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'dor',
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    leagueId: 'bundesliga',
    country: 'Germany',
    stadium: 'Signal Iduna Park',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/tqo8ge1716960353.png',
    espnLogoUrl: espnCrest('124'),
    espnId: '124',
    providerId: '165',
    color: '#FDE100',
    colorSecondary: '#000000',
    followable: true,
  },
  {
    id: 'juv',
    name: 'Juventus',
    shortName: 'JUV',
    leagueId: 'seriea',
    country: 'Italy',
    stadium: 'Allianz Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png',
    espnLogoUrl: espnCrest('111'),
    espnId: '111',
    providerId: '496',
    color: '#000000',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'mil',
    name: 'AC Milan',
    shortName: 'MIL',
    leagueId: 'seriea',
    country: 'Italy',
    stadium: 'San Siro',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png',
    espnLogoUrl: espnCrest('103'),
    espnId: '103',
    providerId: '489',
    color: '#FB090B',
    colorSecondary: '#000000',
    followable: true,
  },
  {
    id: 'nyc',
    name: 'New York City FC',
    shortName: 'NYC',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Yankee Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/m9vis71735140655.png',
    espnLogoUrl: espnCrest('17606'),
    espnId: '17606',
    providerId: '1604',
    color: '#6CACE4',
    colorSecondary: '#F15524',
    followable: true,
  },
  {
    id: 'sea',
    name: 'Seattle Sounders',
    shortName: 'SEA',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Lumen Field',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/2dy5cx1706711036.png',
    espnLogoUrl: espnCrest('9726'),
    espnId: '9726',
    providerId: '1595',
    color: '#5D9741',
    colorSecondary: '#005595',
    followable: true,
  },
  {
    id: 'chi',
    name: 'Chicago Fire',
    shortName: 'CHI',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Soldier Field',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/8xuc781639493166.png',
    espnLogoUrl: espnCrest('182'),
    espnId: '182',
    providerId: '1607',
    color: '#7CCDEF',
    colorSecondary: '#FF0000',
    followable: true,
  },
  {
    id: 'atl',
    name: 'Atlanta United',
    shortName: 'ATL',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Mercedes-Benz Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/ej091x1602103070.png',
    espnLogoUrl: espnCrest('18418'),
    espnId: '18418',
    providerId: '1608',
    color: '#80000A',
    colorSecondary: '#A19060',
    followable: true,
  },
  {
    id: 'van',
    name: 'Vancouver Whitecaps',
    shortName: 'VAN',
    leagueId: 'mls',
    country: 'Canada',
    stadium: 'BC Place',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/tpwxpy1473536521.png',
    providerId: '1603',
    color: '#00245E',
    colorSecondary: '#9DC2EA',
    followable: true,
  },
  {
    id: 'ne',
    name: 'New England Revolution',
    shortName: 'NE',
    leagueId: 'mls',
    country: 'United States',
    stadium: 'Gillette Stadium',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/1ula2l1639493143.png',
    espnLogoUrl: espnCrest('189'),
    espnId: '189',
    providerId: '1609',
    color: '#CE0E2D',
    colorSecondary: '#0A2240',
    followable: true,
  },
  {
    id: 'nap',
    name: 'Napoli',
    shortName: 'NAP',
    leagueId: 'seriea',
    country: 'Italy',
    stadium: 'Stadio Diego Armando Maradona',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/l8qyxv1742982541.png',
    espnLogoUrl: espnCrest('114'),
    espnId: '114',
    providerId: '492',
    color: '#12A0D7',
    colorSecondary: '#003C82',
    followable: true,
  },
  {
    id: 'fey',
    name: 'Feyenoord',
    shortName: 'FEY',
    leagueId: 'eredivisie',
    country: 'Netherlands',
    stadium: 'De Kuip',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/uturtx1473534803.png',
    providerId: '209',
    color: '#E2001A',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'por',
    name: 'Porto',
    shortName: 'POR',
    leagueId: 'primeira',
    country: 'Portugal',
    stadium: 'Estádio do Dragão',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/xu47rb1628855600.png',
    providerId: '212',
    color: '#00428C',
    colorSecondary: '#FFFFFF',
    followable: true,
  },
  {
    id: 'mon',
    name: 'Monaco',
    shortName: 'MON',
    leagueId: 'ligue1',
    country: 'Monaco',
    stadium: 'Stade Louis II',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/exjf5l1678808044.png',
    espnLogoUrl: espnCrest('174'),
    espnId: '174',
    providerId: '91',
    color: '#E51B22',
    colorSecondary: '#CB9F18',
    followable: true,
  },
  {
    id: 'vlr',
    name: 'Villarreal',
    shortName: 'VIL',
    leagueId: 'laliga',
    country: 'Spain',
    stadium: 'Estadio de la Cerámica',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png',
    espnLogoUrl: espnCrest('102'),
    espnId: '102',
    providerId: '533',
    color: '#FFE667',
    colorSecondary: '#005187',
    followable: true,
  },
  {
    id: 'ray',
    name: 'Rayo Vallecano',
    shortName: 'RAY',
    leagueId: 'laliga',
    country: 'Spain',
    stadium: 'Vallecas',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/nzhu941655595465.png',
    espnLogoUrl: espnCrest('101'),
    espnId: '101',
    providerId: '728',
    color: '#E53027',
    colorSecondary: '#FFFFFF',
    followable: false,
  },
  {
    id: 'cvc',
    name: 'Coventry City',
    shortName: 'COV',
    leagueId: 'epl',
    country: 'England',
    stadium: 'CBS Arena',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/uxyqys1424033798.png',
    espnLogoUrl: espnCrest('388'),
    espnId: '388',
    providerId: '1346',
    color: '#77BBFF',
    colorSecondary: '#FFFFFF',
    followable: false,
  },
  {
    id: 'ips',
    name: 'Ipswich Town',
    shortName: 'IPS',
    leagueId: 'epl',
    country: 'England',
    stadium: 'Portman Road',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/mdj1ey1634670785.png',
    espnLogoUrl: espnCrest('373'),
    espnId: '373',
    providerId: '57',
    color: '#3A64A3',
    colorSecondary: '#DE2C37',
    followable: false,
  },
  {
    id: 'sab',
    name: 'Sabah',
    shortName: 'SAB',
    leagueId: 'other',
    country: 'Azerbaijan',
    stadium: 'Bank Respublika Arena',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/placeholder.png',
    providerId: '13976',
    color: '#1B4B8A',
    colorSecondary: '#FFFFFF',
    followable: false,
  },
  {
    id: 'slb',
    name: 'Slovan Bratislava',
    shortName: 'SLO',
    leagueId: 'other',
    country: 'Slovakia',
    stadium: 'Tehelné pole',
    badgeUrl: 'https://r2.thesportsdb.com/images/media/team/badge/placeholder.png',
    providerId: '656',
    color: '#A0112B',
    colorSecondary: '#FFFFFF',
    followable: false,
  },
]

/**
 * Club registry. The static TEAMS above are the curated core (nice crests, short names);
 * clubs fetched from the feed are registered at runtime so any club in a supported league can be followed.
 */
const byId = new Map<string, Team>()
const byProviderId = new Map<string, Team>()
const byName = new Map<string, Team>()
let version = 0

function aliasesFor(t: Team): string[] {
  const keys = [t.name.toLowerCase(), t.shortName.toLowerCase()]
  if (t.name === 'Paris Saint-Germain') keys.push('paris sg', 'psg')
  if (t.name === 'Inter Milan') keys.push('internazionale', 'inter')
  if (t.name === 'Atlético Madrid') keys.push('atletico madrid', 'atlético de madrid')
  if (t.name === 'Manchester United') keys.push('man united', 'man utd')
  if (t.name === 'Manchester City') keys.push('man city')
  return keys
}

const REGISTRY_KEY = 'sfp.teamRegistry.v1'
const REGISTRY_CAP = 600
/** Feed clubs get ids like t133619; core clubs have short slugs. */
const isFeedId = (id: string): boolean => /^t\d+$/.test(id)
/** Nothing is persisted until the stored registry has been read back, so startup can't clobber it. */
let restored = false

function compact(t: Team): Partial<Team> {
  const out: Partial<Team> = {}
  for (const [k, v] of Object.entries(t) as [keyof Team, Team[keyof Team]][]) {
    if (v !== '' && v !== undefined && v !== null) (out as Record<string, unknown>)[k] = v
  }
  return out
}

/**
 * Add or update clubs. The static core always wins over feed data; among feed clubs, newer non-empty
 * fields win but the id stays stable so follows keep working.
 */
export function registerTeams(teams: Team[]): void {
  let changed = false
  for (const t of teams) {
    const existing = byProviderId.get(t.providerId)
    let merged: Team
    if (!existing) merged = t
    else if (!isFeedId(existing.id)) merged = { ...t, ...existing, followable: true }
    else merged = { ...existing, ...compact(t), id: existing.id }
    if (existing && JSON.stringify(existing) === JSON.stringify(merged)) continue
    byId.set(merged.id, merged)
    byProviderId.set(merged.providerId, merged)
    for (const k of aliasesFor(merged)) byName.set(k, merged)
    changed = true
  }
  if (changed) {
    version += 1
    persistRegistry()
  }
}

function persistRegistry(): void {
  if (!restored || typeof localStorage === 'undefined') return
  try {
    const dynamic = [...byId.values()].filter((t) => isFeedId(t.id)).slice(-REGISTRY_CAP)
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(dynamic))
  } catch {
    /* quota / private mode */
  }
}

/** Re-register every feed club stored on this device. Safe to call before any fixture is read. */
export function restoreRegistry(): void {
  if (restored) return
  if (typeof localStorage === 'undefined') {
    restored = true
    return
  }
  try {
    const raw = localStorage.getItem(REGISTRY_KEY)
    const teams = raw ? (JSON.parse(raw) as Team[]) : []
    if (Array.isArray(teams)) registerTeams(teams.filter((t) => t && typeof t.id === 'string' && t.providerId))
  } catch {
    /* ignore */
  } finally {
    restored = true
  }
}

registerTeams(TEAMS)

/** Bumps whenever the registry changes — components can use it to re-render after a catalogue loads. */
export function registryVersion(): number {
  return version
}

export function getTeam(id: string): Team | undefined {
  return byId.get(id)
}

export function teamByProviderId(providerId: string): Team | undefined {
  return byProviderId.get(providerId)
}

export function resolveTeam(name: string): Team | undefined {
  return byName.get(name.trim().toLowerCase())
}

export function allTeams(): Team[] {
  return [...byId.values()]
}

export function followableTeams(): Team[] {
  return allTeams().filter((t) => t.followable)
}

/** Stable id for a club that only exists in the feed. */
export function dynamicTeamId(providerId: string): string {
  return `t${providerId}`
}
