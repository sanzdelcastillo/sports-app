import { SEED_NEWS } from '../data/news.seed'
import type { NewsItem } from '../domain/types'

export function newsForFollows(follows: string[]): NewsItem[] {
  const set = new Set(follows)
  return SEED_NEWS.filter((item) => item.teamIds.some((id) => set.has(id))).sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  )
}

export function newsForFixture(teamIds: string[]): NewsItem[] {
  const set = new Set(teamIds)
  return SEED_NEWS.filter((item) => item.teamIds.some((id) => set.has(id))).sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  )
}
