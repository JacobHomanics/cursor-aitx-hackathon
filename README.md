# AITX

Universal Expo app for desktop web, mobile web, iOS, and Android, with a Convex backend and Privy login.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) or Xcode / Android Studio
- A [Privy](https://dashboard.privy.io) app

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` into `.env.local` and fill in:
   - `EXPO_PUBLIC_PRIVY_APP_ID`
   - `EXPO_PUBLIC_PRIVY_CLIENT_ID`
3. In the Privy dashboard, enable **Email**, **SMS**, **Google**, and **Twitter**.
   - For web, allow `http://localhost:8081`
   - For native, add an app client, allow the `cursoraitxhackathon` scheme, and for Expo Go add `host.exp.Exponent`
4. Start Convex, then copy the Privy app ID onto the deployment:

```bash
npm run convex:dev
npx convex env set PRIVY_APP_ID <your-privy-app-id>
```

5. In another terminal, start the app:

```bash
npm start            # then press i, a, or w
npm run web
```

## Scripts

```bash
npm start            # Expo dev server
npm run web          # Desktop and mobile web
npm run ios
npm run android
npm run convex:dev   # Convex backend + codegen
```

## Auth flow

Privy issues an ES256 JWT. Convex verifies it in `convex/auth.config.ts` and `convex/users.ts` upserts the signed-in user. Web uses `@privy-io/react-auth`; iOS and Android use `@privy-io/expo`. Supported methods: email, phone, Google, and Twitter.

## Event analyzer

After onboarding, the Analyzer tab sends the student profile (city, state, industry, role, and preferred company) to ChatGPT and matches it with public [Luma](https://lu.ma) events near that city. ChatGPT uses the Convex AI Gateway when it is enabled. Otherwise set `OPENAI_API_KEY` on the Convex deployment:

```bash
npx convex env set OPENAI_API_KEY <your-openai-key>
```

## Course analyzer

The Courses tab uses the same profile and ChatGPT flow against public YouTube courses (playlists and long videos). A YouTube Data API key is optional:

```bash
npx convex env set YOUTUBE_API_KEY <your-youtube-data-api-key>
```

## Internship analyzer

The Internships tab sends the same student profile (and activity log) to ChatGPT and asks for one internship **job title** to apply for — not a live job listing.

## Activity log

Each event and course card has a button to mark it as attended or completed (tap again to undo). These are stored per user in the `activityLog` table (`convex/activity.ts`). On the next analysis, anything already logged is left out of the candidates, and the log (events attended and courses completed) is added to the ChatGPT prompt so it can recommend what builds on what the student has already done.
