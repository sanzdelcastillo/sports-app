import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pitchside.app',
  appName: 'Pitchside',
  webDir: 'dist',
  backgroundColor: '#F3EFE4',
  android: {
    // Serve the bundled app over https so secure-context APIs (clipboard, share) work.
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Pitchside',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#0E3C29',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F3EFE4',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_pitchside',
      iconColor: '#0E3C29',
    },
  },
}

export default config
