import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isNative, platform } from './platform'

/** One-time native setup, called after the first render. Safe no-op in a browser. */
export async function initNative(): Promise<void> {
  if (!isNative()) return
  try {
    await StatusBar.setStyle({ style: Style.Light })
    if (platform() === 'android') await StatusBar.setBackgroundColor({ color: '#F3EFE4' })
  } catch {
    /* status bar is cosmetic */
  }
  try {
    await SplashScreen.hide({ fadeOutDuration: 200 })
  } catch {
    /* ignore */
  }
  // Android hardware back: go back in history, or let the OS close the app at the root.
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.exitApp()
  })
}
