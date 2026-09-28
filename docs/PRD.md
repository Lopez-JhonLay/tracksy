# Tracksy Product Requirements Document

## Status

Final MVP scope

## What the Project Is

Tracksy is a private, sideloaded Android application that reduces the friction between finding a YouTube video and opening it in an existing browser-based media converter.

The core workflow is:

```text
Search YouTube → Use Link → Converter opens with URL filled → Tap Convert
```

Tracksy is a personal learning and portfolio project. It does not operate a conversion backend, extract media, or host converted files.

## Product Structure

Tracksy has two primary tabs:

1. **Discover** searches YouTube using YouTube Data API v3 and displays video metadata.
2. **Download** embeds `https://www.willowindfarm.ca/` in a WebView and passes the selected YouTube URL into its converter form.

The converter is a third-party website. Tracksy does not control its availability, conversion behavior, output quality, advertisements, redirects, or future interface changes.

## In Scope

### Platform

- Android application built with React Native, Expo, and TypeScript.
- Private, sideloaded APK for personal use.
- Bottom navigation with Discover and Download tabs.
- No custom backend, cloud service, database, or user account.

### Discover

- Search YouTube by title, artist, or keyword using YouTube Data API v3.
- Show each result's thumbnail, title, channel, and duration when available.
- Preserve the current query and results while switching tabs.
- Open a result in the official YouTube app or browser.
- Provide a **Use Link** action for each result.

### URL Handoff

When the user taps **Use Link**, Tracksy must:

1. Build the video's canonical YouTube URL.
2. Save the URL in local app state.
3. Copy the URL to the Android clipboard as a fallback.
4. Switch to the Download tab.
5. Wait for the converter page to load.
6. Automatically fill the converter's `#url` field.
7. Trigger the page's input and change events without automatically submitting the form.

The user must explicitly tap the website's **Convert** button.

If automatic filling fails, Tracksy must keep the URL in the clipboard and show a short instruction to paste it manually.

### Embedded Converter

- Load `https://www.willowindfarm.ca/` through `react-native-webview`.
- Show loading, offline, and page-load failure states.
- Provide reload and open-in-browser actions.
- Preserve the selected URL when the WebView reloads.
- Block unexpected popup windows and unsafe URL schemes.
- Open confirmed external navigation in an Android Custom Tab, with the system browser as a fallback.
- Hand supported file downloads to Android's system download handling where technically possible.
- Fall back to an Android Custom Tab, then the system browser, if the WebView cannot complete a file download.

### Security and Privacy

- Restrict the YouTube API key to the Tracksy Android package, signing certificate, and YouTube Data API.
- Apply conservative API quotas.
- Do not inject the YouTube API key or any app secret into the converter WebView.
- Disable unnecessary WebView access to camera, microphone, geolocation, and local files.
- Block mixed HTTP content and non-HTTPS navigation.
- Treat all converter content, scripts, redirects, and downloads as untrusted third-party content.
- Process only content the user owns or has permission to download.

### MVP Completion

The MVP is complete when the user can search YouTube, open a result externally, or send its URL to the Download tab, where the embedded converter loads with the URL already filled and leaves the final Convert action to the user.

## Out of Scope

- A custom NestJS backend or any Tracksy-hosted server.
- yt-dlp, FFmpeg, server-side conversion, or media extraction maintained by Tracksy.
- Cloud hosting, backend authentication, processing queues, job progress, retries, or job history.
- Guaranteeing the availability or behavior of the third-party converter.
- Automatically submitting the converter form.
- Circumventing converter protections, access controls, paywalls, DRM, authentication, or restricted YouTube content.
- iOS, desktop, or web versions.
- Google Play Store distribution.
- User accounts, cloud synchronization, analytics, advertising, or monetization.
- Playlists, albums, or batch conversion.
- A built-in music player, music library, recommendations, lyrics, or equalizer.
- User-selectable converter websites or custom converter profiles; defer this to V2.

## Constraints

- The converter integration depends on the website retaining a compatible page and input field. Tracksy may require an update if the website changes.
- The website may reject WebViews or redirect downloads to another domain at any time.
- YouTube does not officially support using API results to facilitate third-party downloading or audio conversion.
- Tracksy must not represent the converter as an official YouTube service or as functionality operated by Tracksy.

## Success Measure

From a visible search result, the user should reach a converter page with the correct URL filled using one tap, without opening YouTube, copying a link manually, switching to Chrome, or pasting the link manually.
