import { Preferences } from '@capacitor/preferences'
import { isNative } from '../native/platform'

/**
 * Synchronous JSON storage on top of localStorage.
 * In the native shell every write is mirrored to Capacitor Preferences (durable on iOS, which may
 * purge WebView storage), and hydrate() copies it back before first render.
 */
const PREFIX = 'sfp.'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T): void {
  let raw: string
  try {
    raw = JSON.stringify(value)
    localStorage.setItem(key, raw)
  } catch {
    return
  }
  if (isNative() && key.startsWith(PREFIX)) {
    void Preferences.set({ key, value: raw }).catch(() => undefined)
  }
}

/** Native only: restore anything mirrored to Preferences that localStorage has lost. */
export async function hydrate(): Promise<void> {
  if (!isNative()) return
  try {
    const { keys } = await Preferences.keys()
    for (const key of keys) {
      if (!key.startsWith(PREFIX) || localStorage.getItem(key) !== null) continue
      const { value } = await Preferences.get({ key })
      if (value !== null) localStorage.setItem(key, value)
    }
  } catch {
    /* best effort */
  }
}
