# AITX

Universal Expo app for desktop web, mobile web, iOS, and Android.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on a physical device, or Xcode / Android Studio for simulators

## Scripts

```bash
npm start            # Expo dev server (press i, a, or w)
npm run web          # Desktop and mobile web
npm run ios          # iOS simulator / Expo Go
npm run android      # Android emulator / Expo Go
```

Web is responsive: a top navigation bar on desktop widths and bottom tabs on smaller viewports. Native iOS and Android use platform tab bars.

## Project layout

- `src/app` — Expo Router screens (`index`, `explore`) and the root layout
- `src/components/app-tabs.tsx` — native iOS / Android tabs
- `src/components/app-tabs.web.tsx` — responsive web navigation
- `src/hooks/use-breakpoint.ts` — desktop vs mobile web breakpoint

Edit `src/app/index.tsx` to start building.
