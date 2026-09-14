# Putting Pitchside on your iPhone (TestFlight) and Android

Everything below runs on your Mac mini. Do it once; after that, shipping a new version is three commands.

## One-time setup (about an hour, mostly downloads)

1. **Apple Developer Program** — developer.apple.com → Account → Enroll. $99/year. Approval can take a day or two.
2. **Xcode** — Mac App Store → search "Xcode" → Get. It's big (15+ GB). Open it once and accept the license.
3. **CocoaPods** — in Terminal: `sudo gem install cocoapods` (asks for your Mac password).
4. **Node** — if `node -v` in Terminal doesn't print a version, install from nodejs.org (LTS).
5. **The project** — `git clone https://github.com/sanzdelcastillo/sports-app.git` then `cd sports-app` then `npm install`.
6. **Your data key** — copy `.env.example` to `.env.local` and paste your API-Football key.
7. **Tell the app where the server is** — in `.env.local` add a second line:
   `VITE_API_BASE=https://YOUR-VERCEL-URL` (the address Vercel gave you, no trailing slash).
   The phone app can't use relative URLs, so it needs the real address of the proxy.

## Build and run on your own iPhone

```
npm run cap:sync        # builds the web app and copies it into the iOS and Android projects
npm run ios             # opens the project in Xcode
```

In Xcode:
1. Click the blue "App" at the top of the left sidebar → **Signing & Capabilities** → Team: pick your Apple account. Xcode creates the signing certificate for you.
2. Bundle Identifier is `com.pitchside.app` — change it only if Apple says it's taken.
3. Plug in your iPhone with a cable. At the top, pick your iPhone as the destination.
4. Press the ▶ Play button. First time: on the phone, Settings → General → VPN & Device Management → trust your developer certificate. Press ▶ again.

## Send it to testers (TestFlight)

1. In Xcode: Product → Archive. When it finishes, the Organizer window opens.
2. **Distribute App** → **TestFlight & App Store** → Upload. Accept the defaults.
3. Go to appstoreconnect.apple.com → My Apps → Pitchside → TestFlight.
4. Add testers by email (Internal testers need no review; External testers need a short Apple review, usually a day).
5. Testers install the TestFlight app from the App Store and open your invitation.

## Shipping an update later

```
git pull
npm run cap:sync
npm run ios          # then Product → Archive → Distribute
```

## Android (when you're ready)

1. Google Play Console — play.google.com/console — $25 once.
2. Install Android Studio from developer.android.com/studio.
3. `npm run android` opens the project. Build → Generate Signed Bundle → follow the wizard (it creates your signing key; keep that file safe).
4. Upload the .aab in Play Console → Testing → Internal testing.

## Things that only work in the phone app (not the website)

- **Kickoff alerts** — Settings → Alerts. A notification 15 minutes before each of your clubs' games, with where to watch. Tap it to open the game.
- **Add to calendar** — opens the share sheet so you can send the file straight to Calendar.
- Links open in an in-app browser sheet; sharing uses the phone's share sheet.
- Your clubs and settings are stored durably (iOS can purge a plain web app's storage; the shell backs it up).

## If something goes wrong

- Xcode says "No signing certificate": you haven't picked a Team, or the Developer Program enrollment isn't approved yet.
- App opens but shows the sample week or empty: `VITE_API_BASE` is missing or wrong in `.env.local`. Rebuild with `npm run cap:sync`.
- Alerts never arrive: on the phone, Settings → Pitchside → Notifications → Allow.
