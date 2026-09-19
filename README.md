# North Bound

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
npm run export:web   # Production static web build (dist/)
npm run ios
npm run android
npm run convex:dev   # Convex backend + codegen
```

## Deploy web on Vercel

The web app is a static Expo export (`expo.web.output` is `static`). `vercel.json` tells Vercel to run `npx expo export -p web` and publish `dist/`.

1. Import this Git repo in [Vercel](https://vercel.com/new). Framework preset should stay **Other** (the config sets `"framework": null`).
2. Add these Production / Preview environment variables (they are baked in at build time):
   - `EXPO_PUBLIC_CONVEX_URL` — your Convex **production** URL (`npx convex deploy` / Convex dashboard)
   - `EXPO_PUBLIC_PRIVY_APP_ID`
   - `EXPO_PUBLIC_PRIVY_CLIENT_ID`
3. In the Privy dashboard, allow the Vercel origin (`https://<project>.vercel.app` and any custom domain).
4. Redeploy after changing `EXPO_PUBLIC_*` values so the new bundle picks them up.

Convex secrets (`PRIVY_APP_ID`, optional `OPENAI_API_KEY` / `YOUTUBE_API_KEY`) stay on the Convex deployment, not on Vercel.

## Auth flow

Privy issues an ES256 JWT. Convex verifies it in `convex/auth.config.ts` and `convex/users.ts` upserts the signed-in user. Web uses `@privy-io/react-auth`; iOS and Android use `@privy-io/expo`. Supported methods: email, phone, Google, and Twitter.

## Weekly planner

After onboarding, Weekly planner loads events, courses, and internships from the student profile (school, location, skills, industry, role, and preferred company). Events come from public [Luma](https://lu.ma) listings near the student’s city. Courses come from public YouTube playlists and long videos. Internships come from live [The Muse](https://www.themuse.com/developers/api/v2) postings.

ChatGPT uses the Convex AI Gateway when it is enabled. Otherwise set `OPENAI_API_KEY` on the Convex deployment:

```bash
npx convex env set OPENAI_API_KEY <your-openai-key>
```

A YouTube Data API key is optional:

```bash
npx convex env set YOUTUBE_API_KEY <your-youtube-data-api-key>
```
## Activity log

Each event and course card has a button to mark it as attended or completed (tap again to undo). These are stored per user in the `activityLog` table (`convex/activity.ts`). On the next analysis, anything already logged is left out of the candidates, and the log (events attended and courses completed) is added to the ChatGPT prompt so it can recommend what builds on what the student has already done.
