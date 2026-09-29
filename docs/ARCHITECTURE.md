# Tracksy Architecture

## Overview

Tracksy is a single-screen Android Expo application. It has no backend, database, authentication, embedded browser, or Tracksy-managed media processing.

```text
User
  -> Discover screen
  -> YouTube Data API v3
  -> Copy & Open
  -> Android clipboard
  -> Android Custom Tab / system browser
  -> willowindfarm.ca
```

## Stack

- Expo SDK 57, React Native, TypeScript, and Expo Router.
- TanStack Query for YouTube server state.
- `expo-clipboard` for copying the canonical URL.
- `expo-web-browser` for the attached browser and `expo-linking` as fallback.
- `expo-localization` for device-derived search locale.
- Zod for runtime validation of external responses and public configuration.
- Jest and React Native Testing Library for automated tests.
- pnpm and EAS Build for dependency and APK workflows.

Android application ID: `com.jhonlaylopez.tracksy`. Android 10/API 29 is the minimum supported version.

## Project Structure

```text
app/                         Root layout and single Discover route
src/config/                  Runtime configuration and locale selection
src/features/discovery/      YouTube client, query state, UI, and tests
src/features/converter/      Copy/open handoff and browser boundary
src/providers/               Root application providers
src/theme/                   Semantic tokens, theme provider, primitives
```

Feature code may consume another feature only through its public `index.ts` exports. Shared imports use the `@/` alias.

## Discovery

On screen mount, Tracksy chooses one query from a small local music-discovery pool and loads it while leaving the search field empty. This rotates the initial feed without claiming personalization or true randomness. User-entered searches start only from keyboard submission or the Search button; queries shorter than two trimmed characters are rejected.

The YouTube adapter:

- Calls `search.list` with `type=video`, `maxResults=20`, `safeSearch=moderate`, and device-derived region/language with `PH/en` fallback.
- Calls `videos.list` to enrich results with duration.
- Preserves search order, cancels superseded requests, and maps external data into local contracts.
- Uses explicit **Load More** and `nextPageToken`; scrolling never fetches automatically.
- Deduplicates pages by `videoId` and caches results only for the running app session.
- Maps offline, quota, invalid-key, unavailable-service, and empty results to distinct UI states.

The initial feed consumes the same YouTube search quota as a manual search and uses the same caching, pagination, and failure handling.

Core result contract:

```ts
type SearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  canonicalUrl: string;
};
```

`thumbnailUrl` remains part of API normalization but is not rendered in the compact MVP list.

## Browser Handoff

When **Copy & Open** is tapped:

1. Copy the result's canonical YouTube URL with `expo-clipboard`.
2. Open `https://www.willowindfarm.ca/` with `expo-web-browser`.
3. Fall back to `expo-linking` if the Custom Tab is unavailable.
4. Tell the user if copying or opening fails; opening still proceeds after a clipboard failure.

The external page is outside the React Native process. Tracksy cannot inject JavaScript, locate its input, paste automatically, block its ads, inspect downloads, or control redirects. The user pastes and submits manually.

## Configuration and Security

The client sends the YouTube key with `x-goog-api-key`, `X-Android-Package`, and `X-Android-Cert`. Development and preview builds use separately restricted keys managed through EAS environments.

The key is extractable client configuration, not a secret. Restrict each key to its package/fingerprint pair and YouTube Data API v3, use conservative quotas, and monitor usage.

Never log keys, complete API request URLs, clipboard contents, selected URLs, or converter URLs. Treat YouTube responses and all external browser content as untrusted. Never automate conversion or add restricted-content bypasses.

## Failure Handling

- Invalid or missing configuration disables search with an actionable state.
- Search failures remain retryable where appropriate and cached results stay visible.
- Clipboard failure does not prevent the converter from opening.
- Browser failure leaves the URL potentially available in the clipboard and shows a retry message.
- Converter downtime and converter-side behavior are outside Tracksy's reliability boundary.

## Verification

Automated tests cover configuration, locale fallback, API normalization/errors, duration parsing, pagination/deduplication, UI states, external YouTube linking, clipboard handoff, and browser fallback.

Manual Android verification covers real search, Load More, YouTube linking, Copy & Open, clipboard paste, theme behavior, and the preview APK. The MVP acceptance flow passed on Android 16. Android 10/API 29 remains the configured minimum but has not been verified on a physical Android 10 device.
