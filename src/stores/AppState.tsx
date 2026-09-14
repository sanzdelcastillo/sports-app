import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { DestinationId, Fixture, FixtureChange, Prediction, SeenMap } from '../domain/types'
import { diffWeek, mergeChanges, snapshotWeek } from '../lib/changes'
import { type Setup } from '../lib/setupCode'
import { readJson, writeJson } from '../lib/storage'
import { bootTeams, rememberCustomTeams } from '../services/clubs'
import { alertsPermitted, cancelAllAlerts, scheduleKickoffAlerts } from '../native/alerts'
import { isNative } from '../native/platform'
import { loadFollowedWeek, readLastGood, seedWeek, staleTeams, type WeekResult } from '../services/fixtures'
import { anyInPlay, applyLive, fetchLiveSoccer, type LiveUpdate } from '../services/livescores'

const FOLLOWS_KEY = 'sfp.follows.v1'
const SUBS_KEY = 'sfp.subscriptions.v1'
const SPOILER_KEY = 'sfp.hideScores.v1'
const CRESTS_KEY = 'sfp.showCrests.v1'
const ONBOARDED_KEY = 'sfp.onboarded.v1'
const ALERTS_KEY = 'sfp.kickoffAlerts.v1'
const SEEN_KEY = 'sfp.seen.v1'
const CHANGES_KEY = 'sfp.changes.v1'
const LATER_KEY = 'sfp.watchLater.v1'
const PREDICTIONS_KEY = 'sfp.predictions.v1'

interface AppState {
  follows: string[]
  followSet: Set<string>
  toggleFollow: (teamId: string) => void
  subscribed: DestinationId[]
  toggleSubscription: (id: DestinationId) => void
  /** Spoiler protection: hide scores for live and finished games until revealed. */
  hideScores: boolean
  toggleHideScores: () => void
  /** Club crests and player photos on; off shows text badges only. */
  showCrests: boolean
  toggleShowCrests: () => void
  /** Kickoff alerts (native only): a notification 15 minutes before each followed game. */
  kickoffAlerts: boolean
  setKickoffAlerts: (on: boolean) => Promise<boolean>
  /** First-run flow finished. */
  onboarded: boolean
  finishOnboarding: () => void
  /** Replace follows, apps and saved games in one go (setup code, restore). */
  applySetup: (setup: Setup) => void
  /** Wipe everything this app stored on the device. */
  clearAll: () => void
  /** Kickoff moves and postponements spotted since the last visit, until dismissed. */
  changes: FixtureChange[]
  changeFor: (fixtureId: string) => FixtureChange | undefined
  dismissChanges: () => void
  /** Games saved to catch up on later. Their scores stay hidden until marked watched. */
  watchLater: string[]
  isSavedForLater: (fixtureId: string) => boolean
  toggleWatchLater: (fixtureId: string) => void
  /** Your score call per game, kept locally (the seed of the friends leaderboard later). */
  predictions: Record<string, Prediction>
  setPrediction: (fixtureId: string, prediction: Prediction | null) => void
  markWatched: (fixtureId: string) => void
  week: WeekResult
  /** 'on' once the premium livescore feed has answered; 'off' when the proxy has no key. */
  liveFeed: 'unknown' | 'on' | 'off'
  loading: boolean
  /** Fetch what's stale. `force` re-fetches every club (manual Refresh). */
  refresh: (force?: boolean) => Promise<void>
  allFixtures: Fixture[]
}

const Ctx = createContext<AppState | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  bootTeams()
  const [follows, setFollows] = useState<string[]>(() => readJson<string[]>(FOLLOWS_KEY, []))
  const [subscribed, setSubscribed] = useState<DestinationId[]>(() =>
    readJson<DestinationId[]>(SUBS_KEY, []),
  )
  const [hideScores, setHideScores] = useState<boolean>(() =>
    readJson<boolean>(SPOILER_KEY, false),
  )
  const [showCrests, setShowCrests] = useState<boolean>(() => readJson<boolean>(CRESTS_KEY, true))
  const [onboarded, setOnboarded] = useState<boolean>(() => readJson<boolean>(ONBOARDED_KEY, false))
  const [kickoffAlerts, setKickoffAlertsState] = useState<boolean>(() => readJson<boolean>(ALERTS_KEY, false))
  const [seen, setSeen] = useState<SeenMap>(() => readJson<SeenMap>(SEEN_KEY, {}))
  const [changes, setChanges] = useState<FixtureChange[]>(() =>
    readJson<FixtureChange[]>(CHANGES_KEY, []),
  )
  const [watchLater, setWatchLater] = useState<string[]>(() => readJson<string[]>(LATER_KEY, []))
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(() => readJson<Record<string, Prediction>>(PREDICTIONS_KEY, {}))
  const [week, setWeek] = useState<WeekResult>(() => {
    const lastGood = readLastGood()
    return {
      fixtures: seedWeek(readJson<string[]>(FOLLOWS_KEY, [])),
      source: lastGood ? 'cached' : 'seed',
      fetchedAt: lastGood?.fetchedAt ?? new Date().toISOString(),
    }
  })
  const [loading, setLoading] = useState(true)
  const [liveFeed, setLiveFeed] = useState<'unknown' | 'on' | 'off'>('unknown')

  useEffect(() => {
    writeJson(FOLLOWS_KEY, follows)
    rememberCustomTeams(follows)
  }, [follows])
  useEffect(() => writeJson(SUBS_KEY, subscribed), [subscribed])
  useEffect(() => writeJson(SPOILER_KEY, hideScores), [hideScores])
  useEffect(() => writeJson(CRESTS_KEY, showCrests), [showCrests])
  useEffect(() => writeJson(ONBOARDED_KEY, onboarded), [onboarded])
  useEffect(() => writeJson(ALERTS_KEY, kickoffAlerts), [kickoffAlerts])

  // Keep the notification queue in step with the week whenever alerts are on.
  useEffect(() => {
    if (!isNative() || !kickoffAlerts) return
    void scheduleKickoffAlerts(week.fixtures, subscribed)
  }, [kickoffAlerts, week.fixtures, subscribed])
  useEffect(() => writeJson(SEEN_KEY, seen), [seen])
  useEffect(() => writeJson(CHANGES_KEY, changes), [changes])
  useEffect(() => writeJson(LATER_KEY, watchLater), [watchLater])
  useEffect(() => writeJson(PREDICTIONS_KEY, predictions), [predictions])

  const refresh = useCallback(async (force = false) => {
    setLoading(true)
    const next = await loadFollowedWeek(follows, force ? follows : staleTeams(follows))
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

  const lastLivePoll = useRef(0)
  const lastLiveUpdates = useRef<LiveUpdate[]>([])
  // Live scores: poll every two minutes, but only while one of the week's games could be in play.
  useEffect(() => {
    if (liveFeed === 'off' || !anyInPlay(week.fixtures)) return
    let cancelled = false
    const apply = (updates: LiveUpdate[]) =>
      setWeek((prev) => {
        const fixtures = applyLive(prev.fixtures, updates)
        return fixtures === prev.fixtures ? prev : { ...prev, fixtures }
      })
    // A freshly loaded week arrives without live data; re-apply what we last heard before polling again.
    if (lastLiveUpdates.current.length) apply(lastLiveUpdates.current)
    const tick = async () => {
      if (Date.now() - lastLivePoll.current < 45_000) return
      lastLivePoll.current = Date.now()
      try {
        const updates = await fetchLiveSoccer()
        if (cancelled) return
        lastLiveUpdates.current = updates
        setLiveFeed('on')
        apply(updates)
      } catch (error) {
        if (!cancelled && error instanceof Error && error.name === 'NoDataKey') setLiveFeed('off')
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), 120_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [week.fixtures, liveFeed])

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

  const setPrediction = useCallback((fixtureId: string, prediction: Prediction | null) => {
    setPredictions((prev) => {
      const next = { ...prev }
      if (prediction) next[fixtureId] = prediction
      else delete next[fixtureId]
      return next
    })
  }, [])

  const toggleHideScores = useCallback(() => setHideScores((prev) => !prev), [])
  const toggleShowCrests = useCallback(() => setShowCrests((prev) => !prev), [])
  const finishOnboarding = useCallback(() => setOnboarded(true), [])

  const setKickoffAlerts = useCallback(async (on: boolean) => {
    if (!on) {
      setKickoffAlertsState(false)
      await cancelAllAlerts()
      return false
    }
    const ok = await alertsPermitted()
    setKickoffAlertsState(ok)
    return ok
  }, [])

  const applySetup = useCallback((setup: Setup) => {
    setFollows(setup.follows)
    setSubscribed(setup.subscribed)
    setWatchLater(setup.watchLater)
    setHideScores(setup.hideScores)
    setOnboarded(true)
  }, [])

  const clearAll = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sfp.'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
    window.location.assign('/')
  }, [])

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

  const followSet = useMemo(() => new Set(follows), [follows])

  const value = useMemo<AppState>(
    () => ({
      follows,
      followSet,
      toggleFollow,
      subscribed,
      toggleSubscription,
      hideScores,
      toggleHideScores,
      showCrests,
      toggleShowCrests,
      kickoffAlerts,
      setKickoffAlerts,
      onboarded,
      finishOnboarding,
      applySetup,
      clearAll,
      changes,
      changeFor,
      dismissChanges,
      watchLater,
      isSavedForLater,
      toggleWatchLater,
      predictions,
      setPrediction,
      markWatched,
      week,
      liveFeed,
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
      hideScores,
      toggleHideScores,
      showCrests,
      toggleShowCrests,
      kickoffAlerts,
      setKickoffAlerts,
      kickoffAlerts,
      setKickoffAlerts,
      onboarded,
      finishOnboarding,
      applySetup,
      clearAll,
      changes,
      changeFor,
      dismissChanges,
      watchLater,
      isSavedForLater,
      toggleWatchLater,
      predictions,
      setPrediction,
      markWatched,
      week,
      liveFeed,
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
