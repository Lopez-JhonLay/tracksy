# Tracksy Product Requirements

## What Tracksy Is

Tracksy is a private Android app that reduces the friction between finding a YouTube video and opening its link in an existing browser-based converter.

```text
Search YouTube -> Copy & Open -> Attached browser opens -> Paste -> Convert
```

Tracksy is a personal learning project. It does not download, extract, convert, or host media itself.

## In Scope

- One Android 10+ screen built with Expo, React Native, and TypeScript.
- YouTube search using YouTube Data API v3.
- A rotating **Music for you** feed before the user searches.
- Video title, channel, and duration when available.
- Explicit **Load More** pagination.
- **Open in YouTube** through the YouTube app or browser.
- **Copy & Open**, which copies the canonical YouTube URL and opens `https://www.willowindfarm.ca/` in an Android Custom Tab or browser fallback.
- Manual paste and manual Convert action on the third-party website.
- Light and dark themes following the Android system setting.
- Private APK distribution through EAS Build.

The converter is an untrusted third-party website. Tracksy does not control its availability, advertisements, redirects, output, or future behavior.

## Out of Scope

- A Download tab, embedded WebView, or in-app converter.
- Automatically pasting into or submitting the external converter page.
- A backend, database, authentication, analytics, or persistent history.
- Tracksy-managed downloading, yt-dlp, FFmpeg, conversion, or file storage.
- Circumventing DRM, access controls, authentication, paywalls, or restricted content.
- User-selectable converter websites in the MVP.
- iOS, web, desktop, Play Store distribution, playlists, batch conversion, or a music player.

## Success Measure

From one search screen, the user immediately sees music to explore, can search for another video, and can open the converter with the selected canonical URL already copied. The user only needs to paste the URL and explicitly start conversion.

Users must process only media they own or are authorized to download. YouTube API access does not authorize third-party downloading or audio separation.
