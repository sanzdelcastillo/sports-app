import { LEAGUES, leagueIdFromFollow } from '../data/leagues'
import { getTeam } from '../data/teams'
import type { LeagueId } from '../domain/types'
import { readJson, writeJson } from '../lib/storage'
import { API_ORIGIN } from './theSportsDb'

export interface Headline {
  title: string
  link: string
  source: string
  publishedAt: string | null
}

interface NewsPayload {
  items: Headline[]
  fetchedAt: string
}

const KEY = 'sfp.news.v1'
const TTL_MS = 15 * 60 * 1000

export async function fetchHeadlines(force = false): Promise<NewsPayload> {
  const cached = readJson<NewsPayload | null>(KEY, null)
  if (!force && cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) return cached
  const res = await fetch(`${API_ORIGIN}/api/news`)
  if (!res.ok) {
    if (cached) return cached
    throw new Error(`News ${res.status}`)
  }
  const data = (await res.json()) as NewsPayload
  writeJson(KEY, data)
  return data
}

/** Words that mark a headline as being about something the user follows. */
export function followKeywords(follows: string[]): string[] {
  const words: string[] = []
  for (const id of follows) {
    const league = leagueIdFromFollow(id)
    if (league) {
      const l = LEAGUES[league as LeagueId]
      words.push(l.name, l.shortName)
      continue
    }
    const t = getTeam(id)
    if (!t) continue
    words.push(t.name)
    // Common short forms the press uses
    const first = t.name.split(' ')[0]
    if (first.length >= 5 && !['Real', 'Inter', 'Atlético', 'Manchester', 'Paris', 'Borussia', 'Bayer', 'Sporting', 'Athletic', 'Deportivo'].includes(first)) words.push(first)
    if (t.name === 'Manchester United') words.push('Man Utd', 'Man United')
    if (t.name === 'Manchester City') words.push('Man City')
    if (t.name === 'Tottenham Hotspur') words.push('Spurs', 'Tottenham')
    if (t.name === 'Paris Saint-Germain') words.push('PSG')
    if (t.name === 'Inter Milan') words.push('Inter')
    if (t.name === 'Atlético Madrid') words.push('Atletico')
    if (t.name === 'Bayern Munich') words.push('Bayern')
    if (t.name === 'Borussia Dortmund') words.push('Dortmund')
  }
  return [...new Set(words.map((w) => w.toLowerCase()))]
}

export function isForYou(h: Headline, keywords: string[]): boolean {
  const t = h.title.toLowerCase()
  return keywords.some((k) => t.includes(k))
}
