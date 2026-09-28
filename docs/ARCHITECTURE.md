# Tracksy Architecture

## Status

Final MVP architecture

Related product requirements: [PRD.md](./PRD.md)

## 1. Purpose

This document defines the implementation architecture for Tracksy, an Android-only Expo application that reduces the steps between finding a YouTube video and loading its URL into an existing browser-based converter.

Tracksy is a client-only application. It does not operate a backend, database, authentication system, conversion engine, job queue, or media-storage service.

The primary runtime flow is:

```text
User
  -> Discover tab
  -> YouTube Data API v3
  -> Use Link
  -> Zustand handoff + Android clipboard
  -> Download tab WebView
  -> Autofill willowindfarm.ca
  -> User taps Convert
  -> Android system download or external-browser fallback
```

## 2. Architectural Decisions

| Area | Decision |
|---|---|
| Platform | Android 10 and newer |
| Application | React Native with Expo and TypeScript |
| Navigation | Expo Router with two persistent tabs |
| Server state | TanStack Query |
| Cross-tab state | Zustand, in memory only |
| Web content | `react-native-webview` |
| YouTube access | Direct YouTube Data API v3 calls from the Android client |
| Converter | `https://www.willowindfarm.ca/` loaded as untrusted third-party content |
| Persistence | None across process restarts |
| Backend | None |
| Distribution | Sideloaded APK from EAS internal builds |
| Styling | React Native components and `StyleSheet` |
| Package manager | pnpm with a committed lockfile |
| Android application ID | `com.jhonlaylopez.tracksy` |

### 2.1 Consequences

- The YouTube API key is present in the APK and must be treated as extractable client configuration, not as a secret.
- Search and converter state survive tab changes only while the app process remains alive.
- Converter availability, markup, redirects, output, and download behavior are outside Tracksy's control.
- Android WebView download behavior is used on a best-effort basis. The system browser is the supported fallback.
- A change to the converter's `#url` field or navigation flow may require an application update.

## 3. System Context

```text
┌───────────────────────────────────────────────────────────────┐
│                        Tracksy APK                            │
│                                                               │
│  ┌────────────────────┐        ┌───────────────────────────┐  │
│  │ Discover           │        │ Download                  │  │
│  │                    │        │                           │  │
│  │ Search UI          │        │ Converter WebView         │  │
│  │ TanStack Query     │───────▶│ Injection + policy layer │  │
│  │ YouTube adapter    │ Zustand│ Clipboard fallback        │  │
│  └─────────┬──────────┘ handoff└─────────────┬─────────────┘  │
└────────────┼──────────────────────────────────┼────────────────┘
             │ HTTPS                            │ HTTPS
             ▼                                  ▼
┌─────────────────────────┐       ┌─────────────────────────────┐
│ YouTube Data API v3     │       │ willowindfarm.ca           │
│ Search and metadata     │       │ Third-party converter      │
└─────────────────────────┘       └──────────────┬──────────────┘
                                                │
                                                ▼
                                  Android download handling
                                  or external browser fallback
```

Trust boundaries:

- YouTube API responses are external data and must be normalized before display.
- All converter HTML, JavaScript, messages, redirects, and downloads are untrusted.
- Only native Tracksy code may access YouTube credentials and application configuration.
- The converter WebView must never receive the YouTube API key, signing fingerprint, or environment configuration.

## 4. Application Organization

```text
app/
├── _layout.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── index.tsx              # Discover
    └── download.tsx           # Download

src/
├── features/
│   ├── discovery/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   └── converter/
│       ├── components/
│       ├── injection/
│       ├── navigation/
│       └── types.ts
├── config/
├── store/
├── providers/
└── utils/

e2e/
└── maestro/
```

### 4.1 Root providers

The root layout owns:

- A single `QueryClient` for session-scoped YouTube caching.
- Error boundaries for native screen failures.
- Theme and safe-area providers.
- No persistence provider or rehydration step.

The tab navigator keeps both screens mounted after first visit. Switching tabs must not reset search results or the current converter page.

### 4.2 Discover feature

The Discover feature owns:

- Search input and explicit submission.
- YouTube request construction and response normalization.
- Pagination, loading, empty, and error states.
- Opening a result in YouTube or a browser.
- Creating a converter handoff and navigating to Download.

It does not know WebView selectors or converter implementation details.

### 4.3 Converter feature

The Converter feature owns:

- The third-party WebView lifecycle.
- Exact-origin validation.
- URL injection and result-message validation.
- Navigation, popup, and unsafe-scheme policy.
- Clipboard fallback messaging.
- Reload and external-browser actions.

It does not call the YouTube API or receive the YouTube API key.

## 5. Shared Contracts

```ts
export type SearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  canonicalUrl: string;
};

export type SearchPage = {
  items: SearchResult[];
  nextPageToken?: string;
};

export type ConverterHandoff = {
  requestId: string;
  youtubeUrl: string;
  selectedAt: number;
};

export type InjectionResult =
  | { requestId: string; status: "filled" }
  | {
      requestId: string;
      status: "wrong_origin" | "field_missing" | "script_error";
    };
```

### 5.1 Zustand store

The store contains only session-scoped handoff state:

```ts
type ConverterStore = {
  handoff?: ConverterHandoff;
  sendToConverter: (result: SearchResult) => ConverterHandoff;
  clearHandoff: (requestId: string) => void;
};
```

Rules:

- `sendToConverter` creates a new request for every tap, including repeated taps on the same video.
- Generate `requestId` from the current timestamp plus an incrementing in-process counter.
- `clearHandoff` clears state only when its ID matches the current handoff.
- Do not persist the store to AsyncStorage, SQLite, or another storage layer.
- Clipboard writing and navigation remain screen/application actions rather than hidden store side effects.

## 6. YouTube Integration

### 6.1 Configuration

Build environments provide:

```text
EXPO_PUBLIC_YOUTUBE_API_KEY
EXPO_PUBLIC_ANDROID_CERT_SHA1
EXPO_PUBLIC_SEARCH_FALLBACK_REGION=PH
EXPO_PUBLIC_SEARCH_FALLBACK_LANGUAGE=en
```

The application ID is fixed in Expo configuration and in the API client:

```text
com.jhonlaylopez.tracksy
```

Maintain separate YouTube API keys for development and preview builds because their signing certificates may differ. Each key must be restricted in Google Cloud to:

- The matching Android package and SHA-1 certificate fingerprint.
- YouTube Data API v3 only.
- Conservative quotas appropriate for a personal application.

Every request sends credentials as headers:

```http
x-goog-api-key: <configured key>
X-Android-Package: com.jhonlaylopez.tracksy
X-Android-Cert: <configured signing SHA-1>
```

The key must not appear in query strings, logs, error messages, WebView scripts, or clipboard content.

### 6.2 Locale resolution

Read the first device locale through `expo-localization`.

- Use its two-letter uppercase region as `regionCode` when present.
- Use its primary language subtag as `relevanceLanguage` when present.
- Fall back to `PH` and `en` independently when either value is missing or invalid.
- Use `safeSearch=moderate` for every request.

### 6.3 Search request

Search begins only when the user taps Search or submits from the keyboard.

- Trim the query.
- Require at least two characters.
- Do not search on each keystroke.
- Cancel any superseded request through the TanStack Query `AbortSignal`.

Request:

```http
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &type=video
  &maxResults=20
  &safeSearch=moderate
  &q=<encoded query>
  &regionCode=<resolved region>
  &relevanceLanguage=<resolved language>
  &pageToken=<optional next token>
```

Use partial response fields for only:

- `nextPageToken`
- `items.id.videoId`
- Required `items.snippet` fields

### 6.4 Metadata request

After search returns video IDs, request durations in one call:

```http
GET https://www.googleapis.com/youtube/v3/videos
  ?part=contentDetails
  &id=<comma-separated IDs>
```

Normalize results by:

- Preserving the original search order.
- Merging duration by `videoId`.
- Parsing ISO-8601 durations into seconds.
- Treating a missing duration as optional rather than failing the page.
- Decoding titles and channel names as plain text; never render response content as HTML.
- Building `canonicalUrl` as `https://www.youtube.com/watch?v={videoId}`.

### 6.5 Pagination and caching

- Use a TanStack infinite query keyed by trimmed query, region, and language.
- The first page and every **Load More** action fetch exactly 20 results.
- Never fetch automatically based on scroll position.
- Deduplicate accumulated pages by `videoId`, preserving first occurrence order.
- Disable Load More while a page is being requested.
- Use a five-minute stale time and in-memory garbage collection only.
- A full app restart starts with an empty query cache.

### 6.6 Error model

Normalize transport and API errors into:

| Code | User behavior |
|---|---|
| `offline` | Show offline state and Retry |
| `invalid_key` | Show configuration error; do not retry automatically |
| `quota_exceeded` | Explain that search quota is exhausted; do not retry automatically |
| `service_unavailable` | Show temporary failure and Retry |
| `cancelled` | Suppress UI error because a newer request replaced it |
| `unknown` | Show a generic search failure and Retry |

Retry once for network and server-side failures. Do not retry invalid-key, quota, validation, or cancellation failures.

## 7. Discover Runtime Flow

```text
User submits query
  -> validate and normalize query
  -> TanStack Query calls search.list
  -> collect video IDs
  -> call videos.list for durations
  -> normalize SearchPage
  -> render FlatList
```

Result actions:

### Open in YouTube

Pass the canonical HTTPS URL to `Linking.openURL`. Android chooses the installed YouTube application when available and otherwise uses the default browser.

### Use Link

```text
User taps Use Link
  -> sendToConverter(result) creates handoff
  -> copy canonical URL with expo-clipboard
  -> navigate to Download tab
  -> converter sees new requestId
  -> remount WebView at converter home page
```

Clipboard failure does not block the handoff. It only removes the manual-paste fallback and must be surfaced as a small non-blocking message.

## 8. Converter Integration

### 8.1 WebView lifecycle

- Load the converter lazily on the first visit to Download or the first handoff.
- Keep it mounted during ordinary tab switches.
- A new `requestId` changes the WebView component key, discarding the previous converter page.
- Every new handoff starts at `https://www.willowindfarm.ca/`.
- Do not reuse a partially completed conversion for a different result.

### 8.2 Injection sequence

Injection occurs after `onLoadEnd` only when:

- A handoff exists.
- The main-frame URL has the exact origin `https://www.willowindfarm.ca`.
- The current request has not already reported success.

The generated script must:

1. Compare `window.location.origin` to the trusted origin.
2. Find `document.querySelector("#url")`.
3. Use the native `HTMLInputElement.prototype.value` setter.
4. Dispatch bubbling `input` and `change` events.
5. Send one JSON-encoded `InjectionResult` through `window.ReactNativeWebView.postMessage`.
6. Catch errors and report `script_error`.
7. End with a truthy expression for Android WebView compatibility.

The handoff URL and request ID must be serialized with `JSON.stringify` when building the script. They must never be inserted through raw string concatenation.

Use Zod or an equivalently strict runtime schema to validate every incoming WebView message. Ignore:

- Non-JSON messages.
- Unknown properties or statuses.
- Messages whose `requestId` does not match the active handoff.
- Messages received from an untrusted main-frame origin.

On `filled`, clear the matching handoff and hide fallback UI. Do not click, submit, or synthesize activation of the converter's Convert button.

### 8.3 Injection failure behavior

| Status | Response |
|---|---|
| `wrong_origin` | Stop injection and show Reload/Open in browser |
| `field_missing` | Keep clipboard value and show manual-paste guidance |
| `script_error` | Keep clipboard value and show Retry/Reload |
| Load failure | Show offline/page-unavailable state |
| Render process gone | Recreate WebView and retain the current handoff |

Reloading returns to the converter home page and retries injection with the same handoff. Opening in the external browser leaves the selected YouTube URL in the clipboard.

## 9. WebView Security Policy

Required settings:

| Setting | Value |
|---|---|
| JavaScript | Enabled |
| DOM storage | Enabled |
| Mixed content | `never` |
| Local file access | Disabled |
| Universal file access | Disabled |
| Geolocation | Disabled |
| Multiple windows | Disabled |
| Media capture permissions | Not requested by Tracksy |
| WebView debugging | Development builds only |
| Session storage | Incognito/session-isolated where compatible |
| Third-party cookies | Disabled unless device testing proves conversion requires them |

Tracksy requests only normal internet/network-state permissions. It does not request camera, microphone, location, contacts, or broad storage permissions.

### 9.1 Main-frame navigation policy

Use `originWhitelist={["https://*"]}` together with `onShouldStartLoadWithRequest`; the callback is the authoritative policy.

| Destination | Action |
|---|---|
| Exact `https://www.willowindfarm.ca` origin | Allow inside WebView |
| Different HTTPS origin | Block, show hostname confirmation, then optionally open through `Linking` |
| HTTP | Block |
| `file:`, `content:`, `data:`, `javascript:` | Block |
| `intent:`, `market:`, custom schemes | Block in MVP |
| Popup/new window | Block without opening automatically |

External navigation confirmation must show the destination hostname. Cancelling leaves the current converter page unchanged.

Subresources loaded by the converter are controlled by Android WebView rather than `onShouldStartLoadWithRequest`; therefore the page remains an untrusted boundary even when main-frame navigation is restricted.

### 9.2 WebView messaging

The native message handler accepts only the documented `InjectionResult` schema. Messages cannot request navigation, clipboard access, native downloads, or access to application configuration.

## 10. Download Behavior

Tracksy does not implement a custom downloader.

1. Allow React Native WebView's Android download handling to pass supported responses to the Android system.
2. Configure user-facing download and permission-failure messages where supported by the WebView package.
3. Do not request legacy broad storage permission on Android 10+.
4. Keep **Open in browser** available in the Download screen toolbar at all times.
5. If the converter uses an unsupported blob, redirect, cookie flow, MIME type, or download host, the user opens the converter in the system browser and completes the download there.

Tracksy does not infer that a download succeeded, track download progress, move files, rename output, or maintain download history.

## 11. UI State and Accessibility

### Discover states

- Initial prompt
- Invalid short query
- Initial loading
- Results
- Loading another page
- Empty result
- Offline
- Quota exhausted
- Invalid configuration
- Retryable service failure

Render results with `FlatList` and stable `videoId` keys. Progress and error states must be textual and accessible, not color-only.

### Download states

- Not loaded yet
- Loading page
- Waiting to inject
- Filled successfully
- Manual paste required
- Page unavailable
- WebView process recovery
- External-navigation confirmation

Buttons require accessible names and Android-sized tap targets. The WebView is not considered the only source of status feedback; native overlays communicate loading and failure states.

## 12. Build and Release Configuration

### 12.1 EAS profiles

Provide:

- `development`: development client/APK with development API key, debugging, and development signing fingerprint.
- `preview`: internally distributed release-like APK with preview API key, debugging disabled, and EAS-managed signing.

The preview profile must produce an APK rather than an AAB because the application is sideloaded and not distributed through Google Play.

### 12.2 Signing and API setup

For each EAS signing identity:

1. Retrieve its SHA-1 fingerprint.
2. Create a dedicated Google Cloud API key.
3. Add the package/fingerprint Android restriction.
4. Restrict the key to YouTube Data API v3.
5. Configure conservative quotas and usage alerts.
6. Store the matching key and SHA-1 in the appropriate EAS environment.

No `.env` file containing a real key is committed. Provide an `.env.example` containing names and placeholder values only.

### 12.3 Runtime validation

On application start, validate that required public configuration exists. Missing configuration disables search and shows a development-oriented configuration error without printing credential values.

## 13. Observability

MVP observability is local and development-only.

- Log lifecycle and normalized error codes, not credentials or payloads.
- Do not log full YouTube request URLs because they may include queries or credentials.
- Do not log clipboard content, selected URLs, injected JavaScript, converter messages, or download URLs.
- Disable WebView debugging and verbose logs in preview builds.
- Do not add analytics, crash-reporting SaaS, or behavioral telemetry.

## 14. Testing Strategy

### 14.1 Unit tests

Test:

- Query trimming and minimum length.
- Device locale normalization and `PH/en` fallback.
- ISO-8601 duration parsing.
- YouTube response mapping and original-order merging.
- Pagination token handling and cross-page `videoId` deduplication.
- Canonical URL creation.
- YouTube error normalization and retry classification.
- Request ID uniqueness and guarded handoff clearing.
- Injection-script escaping and exact-origin validation.
- Injection message schema and active-request matching.
- Navigation policy decisions for every allowed and blocked scheme.

### 14.2 Component tests

Use Jest with React Native Testing Library and mocked service boundaries.

Test:

- Discover initial, loading, result, empty, offline, quota, and retry states.
- Explicit submission and rejection of one-character queries.
- Load More disabling and page appending.
- Open in YouTube and Use Link actions.
- Clipboard failure as a non-blocking condition.
- WebView loading and failure overlays.
- Successful injection, missing field, wrong origin, and script error.
- New handoff remounting and replacing the current converter session.
- External-link confirmation and blocked unsafe schemes.
- Browser fallback availability.

CI must mock YouTube and converter boundaries. Automated tests must not call live YouTube or converter services.

### 14.3 Android smoke tests

Use Maestro with a build-time fake adapter for deterministic tests:

- Submit a search and display fixture results.
- Tap Use Link.
- Switch to Download.
- Load a controlled local/fixture converter page.
- Verify that the URL field is filled.
- Verify that Convert is not triggered automatically.
- Select a second result and verify replacement.

The fake adapter must be excluded or disabled in preview builds.

### 14.4 Manual device verification

Test on Android 10 and one current Android release:

- Real search returns 20 video-only results.
- Load More uses the next page token.
- Device locale and moderate SafeSearch parameters are applied.
- YouTube URLs open in the YouTube app or browser.
- The real converter receives the correct URL without automatic submission.
- A second selection resets and replaces the converter page.
- Missing selector, network failure, downtime, and renderer termination are recoverable.
- Popups, HTTP links, and unsafe schemes cannot escape policy.
- External HTTPS navigation requires confirmation.
- Supported downloads reach Android system handling.
- Unsupported download flows remain possible through Open in browser.
- Killing and reopening Tracksy produces a fresh session.

Use only media the tester owns or is authorized to process during manual converter verification.

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Converter changes `#url` | Detect `field_missing`, retain clipboard value, and provide manual paste/browser fallback |
| Converter blocks WebView | Preserve clipboard value and open the converter externally |
| Converter launches advertisements or redirects | Block popups and require confirmation for external HTTPS navigation |
| Android WebView cannot complete download | Keep Open in browser permanently available |
| API key extracted from APK | Android/app/API restrictions, quotas, monitoring, and separate keys per build |
| Search quota exhausted | Explicit submission, manual pagination, no live suggestions, and clear quota state |
| Third-party page becomes unsafe | Exact-origin policy, restricted capabilities, no secrets in WebView, and ability to disable/remove integration in an update |
| YouTube or converter policy changes | Keep the dependency and policy limitation explicit; do not claim official support |

## 16. Policy Boundary

The YouTube Data API is used only for public discovery metadata. It does not provide downloadable media or authorize audio extraction. Tracksy must not present itself, the converter, or the conversion workflow as an official YouTube feature.

The application is restricted to private, sideloaded use and content the user owns or has permission to process. It must not add DRM bypass, authentication bypass, restricted-content handling, automated form submission, batch conversion, or a Tracksy-managed conversion service.

Relevant references:

- [YouTube Data API overview](https://developers.google.com/youtube/v3/getting-started)
- [YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- [Google API-key restrictions](https://docs.cloud.google.com/docs/authentication/api-keys)
- [Expo WebView documentation](https://docs.expo.dev/versions/latest/sdk/webview/)
- [React Native WebView reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)
