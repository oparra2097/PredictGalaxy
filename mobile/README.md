# OdysseySky Mobile

A React Native (Expo) client for the OdysseySky backend — the Next.js app
one directory up. This app has no server logic of its own; every screen is
a thin client over the same API the web app uses (`/api/search`,
`/api/search/self-transfer`, `/api/deals`, `/api/routes`, `/api/collect`).

## Running it on your phone

1. **Point it at a backend first.** This app doesn't bundle a backend — it
   needs the OdysseySky Next.js server running somewhere reachable from
   your phone:
   - Deployed (Vercel, Railway, Fly.io, etc.) — use that public URL.
   - Running locally via `npm run dev` in the repo root — use your
     computer's LAN IP, e.g. `http://192.168.1.20:3000`, not `localhost`.
     Your phone and computer need to be on the same WiFi network.
2. Install the [Expo Go](https://expo.dev/go) app on your phone (App Store
   / Play Store).
3. From this directory:
   ```bash
   npm install
   npx expo start
   ```
4. Scan the QR code Expo Go prints with your phone's camera (iOS) or the
   Expo Go app (Android). The app opens on your phone.
5. Go to the **Settings** tab first, paste in the backend URL from step 1,
   tap Save, then Test connection.

No Xcode/Android Studio, App Store account, or build step needed for this —
Expo Go runs the JS bundle directly on your phone over your network.

## Screens

- **Search** — same flight search as the web app's home page.
- **Self-Transfer** — the "fly via any European hub" virtual-interlining
  search.
- **Tracked** — watched routes, price history, and anomaly ("real deal")
  detection. Pull-to-refresh isn't wired up; it refetches automatically
  whenever you switch to this tab.
- **Deals** — the scanned deal-blog RSS feed.
- **Settings** — configure and test the backend URL. Stored on-device via
  `AsyncStorage`, so it's a one-time setup per device.

## Architecture notes

- `src/lib/api.ts` — all backend calls, prefixed with the URL from
  Settings. Throws `ApiNotConfiguredError` if nothing's been set yet.
- `src/lib/types.ts` — TypeScript types mirroring the backend's JSON
  responses. Hand-duplicated rather than imported from `../lib` in the web
  app — React Native and Next.js are separate build toolchains, and a
  shared-package setup wasn't worth the complexity for four small
  interfaces. If the backend's response shapes change, update both.
- Dark theme colors (`src/theme.ts`) are copied from the web app's
  `tailwind.config.ts` so both feel like the same product.
- The web app's `proxy.ts` (Next.js's replacement for `middleware.ts` as of
  v16) adds permissive CORS headers so this app — a different origin, and
  potentially plain HTTP on a LAN IP during dev — can reach the API.

## What wasn't verified

This was built and verified in a sandboxed environment with no
iOS/Android simulator and a network policy that blocks most outbound
domains. What *was* verified:
- `npx tsc --noEmit` passes with no errors.
- `npx expo export --platform ios` and `--platform android` both bundle
  successfully via Metro (848/843 modules, no resolution errors) —
  confirms all imports and navigation wiring are structurally sound.

What wasn't verified: actually running on a device/simulator, real network
calls to a live backend, or visual/layout correctness. Test on your phone
via Expo Go per the steps above and report back anything that looks off —
particularly the date inputs, which are plain text fields (`YYYY-MM-DD`)
rather than a native date picker, since adding
`@react-native-community/datetimepicker` would be another native
dependency to verify blind.

## Building a real app-store build (later)

This runs great via Expo Go for development and personal use, but Expo Go
isn't how you'd ship to the App Store / Play Store. That needs
[EAS Build](https://docs.expo.dev/build/introduction/) (a free tier
exists) to produce a standalone binary, plus Apple Developer ($99/yr) and
Google Play ($25 one-time) accounts to actually publish. Worth doing once
the app itself is validated, not before.

## Known issue

`npm audit` flags a moderate-severity `uuid` vulnerability nested inside
Expo's own native-project-generation tooling (`xcode`/`@expo/config-plugins`,
used only when running `expo prebuild`/`eas build`, not at runtime in the
shipped app). The suggested fix downgrades `expo` to a very old major
version, so it's left as-is — same treatment as the two nested issues
already documented in the web app's README.
