import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SEED_FOLLOW_IDS } from '../data/teams'
import type { DestinationId, Fixture, FixtureChange, Reminder, SeenMap } from '../domain/types'
import { diffWeek, mergeChanges, snapshotWeek } from '../lib/changes'
import { readJson, writeJson } from '../lib/storage'
import { loadFollowedWeek, seedWeek, type WeekResult } from '../services/fixtures'

const FOLLOWS_KEY = 'sfp.follows.v1'
const SUBS_KEY = 'sfp.subscriptions.v1'
const REMIND_KEY = 'sfp.reminders.v1'
const SPOILER_KEY = 'sfp.hideScores.v1'
const SEEN_KEY = 'sfp.seen.v1'
const CHANGES_KEY = 'sfp.changes.v1'
const LATER_KEY = 'sfp.watchLater.v1'

interface AppState {
  follows: string[]
  followSet: Set<string>
  toggleFollow: (teamId: string) => void
  subscribed: DestinationId[]
  toggleSubscription: (id: DestinationId) => void
  reminders: Reminder[]
  hasReminder: (fixtureId: string) => boolean
  toggleReminder: (fixtureId: string) => void
  /** Spoiler protection: hide scores for live and finished games until revealed. */
  hideScores: boolean
  toggleHideScores: () => void
  /** Kickoff moves and postponements spotted since the last visit, until dismissed. */
  changes: FixtureChange[]
  changeFor: (fixtureId: string) => FixtureChange | undefined
  dismissChanges: () => void
  /** Games saved to catch up on later. Their scores stay hidden until marked watched. */
  watchLater: string[]
  isSavedForLater: (fixtureId: string) => boolean
  toggleWatchLater: (fixtureId: string) => void
  markWatched: (fixtureId: string) => void
  week: WeekResult
  loading: boolean
  refresh: () => Promise<void>
  allFixtures: Fixture[]
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [follows, setFollows] = useState<string[]>(() =>
    readJson<string[]>(FOLLOWS_KEY, SEED_FOLLOW_IDS),
  )
  const [subscribed, setSubscribed] = useState<DestinationId[]>(() =>
    readJson<DestinationId[]>(SUBS_KEY, ['apple-tv-mls']),
  )
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    readJson<Reminder[]>(REMIND_KEY, []),
  )
  const [hideScores, setHideScores] = useState<boolean>(() =>
    readJson<boolean>(SPOILER_KEY, false),
  )
  const [seen, setSeen] = useState<SeenMap>(() => readJson<SeenMap>(SEEN_KEY, {}))
  const [changes, setChanges] = useState<FixtureChange[]>(() =>
    readJson<FixtureChange[]>(CHANGES_KEY, []),
  )
  const [watchLater, setWatchLater] = useState<string[]>(() => readJson<string[]>(LATER_KEY, []))
  const [week, setWeek] = useState<WeekResult>(() => ({
    fixtures: seedWeek(readJson<string[]>(FOLLOWS_KEY, SEED_FOLLOW_IDS)),
    source: 'seed',
    fetchedAt: new Date().toISOString(),
  }))
  const [loading, setLoading] = useState(true)

  useEffect(() => writeJson(FOLLOWS_KEY, follows), [follows])
  useEffect(() => writeJson(SUBS_KEY, subscribed), [subscribed])
  useEffect(() => writeJson(REMIND_KEY, reminders), [reminders])
  useEffect(() => writeJson(SPOILER_KEY, hideScores), [hideScores])
  useEffect(() => writeJson(SEEN_KEY, seen), [seen])
  useEffect(() => writeJson(CHANGES_KEY, changes), [changes])
  useEffect(() => writeJson(LATER_KEY, watchLater), [watchLater])

  const refresh = useCallback(async () => {
    setLoading(true)
    const next = await loadFollowedWeek(follows)
    setWeek(next)
    // Only trust live data for change detection — seed fixtures are a stale snapshot by design.
    if (next.source === 'live') {
      setSeen((prev) => {
        const found = diffWeek(prev, next.fixtures)
        if (found.length) setChanges((existing) => mergeChanges(existing, found))
        return snapshotWeek(prev, next.fixtures)
      })
    }
    setLoading(false)
  }, [follows])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleFollow = useCallback((teamId: string) => {
    setFollows((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    )
  }, [])

  const toggleSubscription = useCallback((id: DestinationId) => {
    setSubscribed((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleReminder = useCallback((fixtureId: string) => {
    setReminders((prev) => {
      const exists = prev.some((r) => r.fixtureId === fixtureId)
      if (exists) return prev.filter((r) => r.fixtureId !== fixtureId)
      return [...prev, { fixtureId, createdAt: new Date().toISOString() }]
    })
  }, [])

  const toggleHideScores = useCallback(() => setHideScores((prev) => !prev), [])

  const changeFor = useCallback(
    (fixtureId: string) => changes.find((c) => c.fixtureId === fixtureId),
    [changes],
  )
  const dismissChanges = useCallback(() => setChanges([]), [])

  const isSavedForLater = useCallback((fixtureId: string) => watchLater.includes(fixtureId), [watchLater])
  const toggleWatchLater = useCallback((fixtureId: string) => {
    setWatchLater((prev) =>
      prev.includes(fixtureId) ? prev.filter((id) => id !== fixtureId) : [...prev, fixtureId],
    )
  }, [])
  const markWatched = useCallback((fixtureId: string) => {
    setWatchLater((prev) => prev.filter((id) => id !== fixtureId))
  }, [])

  const hasReminder = useCallback(
    (fixtureId: string) => reminders.some((r) => r.fixtureId === fixtureId),
    [reminders],
  )

  const followSet = useMemo(() => new Set(follows), [follows])

  const value = useMemo<AppState>(
    () => ({
      follows,
      followSet,
      toggleFollow,
      subscribed,
      toggleSubscription,
      reminders,
      hasReminder,
      toggleReminder,
      hideScores,
      toggleHideScores,
      changes,
      changeFor,
      dismissChanges,
      watchLater,
      isSavedForLater,
      toggleWatchLater,
      markWatched,
      week,
      loading,
      refresh,
      allFixtures: week.fixtures,
    }),
    [
      follows,
      followSet,
      toggleFollow,
      subscribed,
      toggleSubscription,
      reminders,
      hasReminder,
      toggleReminder,
      hideScores,
      toggleHideScores,
      changes,
      changeFor,
      dismissChanges,
      watchLater,
      isSavedForLater,
      toggleWatchLater,
      markWatched,
      week,
      loading,
      refresh,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
