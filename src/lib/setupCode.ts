import type { DestinationId } from '../domain/types'
import { PROVIDER_BY_ID } from '../data/watch'

export interface Setup {
  follows: string[]
  subscribed: DestinationId[]
  watchLater: string[]
  hideScores: boolean
}

const PREFIX = 'WP1.'

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
  const bin = atob(padded)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** A short pasteable code carrying a user's clubs, apps, saved games and spoiler setting. No account needed. */
export function encodeSetup(setup: Setup): string {
  const compact = { f: setup.follows, s: setup.subscribed, w: setup.watchLater, h: setup.hideScores ? 1 : 0 }
  return PREFIX + toBase64Url(JSON.stringify(compact))
}

export function decodeSetup(raw: string): Setup | null {
  const code = raw.trim()
  if (!code.startsWith(PREFIX)) return null
  try {
    const parsed = JSON.parse(fromBase64Url(code.slice(PREFIX.length))) as {
      f?: unknown
      s?: unknown
      w?: unknown
      h?: unknown
    }
    const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
    const subscribed = strings(parsed.s).filter((id): id is DestinationId => id in PROVIDER_BY_ID)
    return {
      follows: strings(parsed.f).slice(0, 60),
      subscribed,
      watchLater: strings(parsed.w).slice(0, 60),
      hideScores: parsed.h === 1 || parsed.h === true,
    }
  } catch {
    return null
  }
}
