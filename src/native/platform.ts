import { Capacitor } from '@capacitor/core'

/** True inside the iOS/Android shell; false in a browser. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export function platform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}
