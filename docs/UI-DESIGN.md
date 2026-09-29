# Tracksy UI Design

This document is the visual source of truth for Tracksy's single native screen. Product behavior belongs in [PRD.md](./PRD.md).

## Direction

Tracksy is playful and efficient: indigo primary actions, lime focus accents, soft-rounded surfaces, compact text-only media cards, Android system typography, and Material Community icons.

## Mascot and App Icon

- The Tracksy mascot is an original rounded indigo music creature with lime headphones, a note-shaped antenna, expressive eyes, and sound-wave cheek marks.
- The launcher icon uses the mascot on a deep-navy background; the Android adaptive foreground keeps the complete silhouette inside the safe area.
- Android themed icons use a single-color silhouette derived from the same mascot.
- Keep the mascot text-free and recognizable at small sizes. Do not add a containing shape, unrelated props, or a separate color palette.

## Color Tokens

| Token | Light | Dark |
|---|---|---|
| `background` | `#F8F9FC` | `#0E0F17` |
| `surface` | `#FFFFFF` | `#171925` |
| `surfaceRaised` | `#FFFFFF` | `#202333` |
| `surfaceMuted` | `#F0F1F7` | `#282B3B` |
| `text` | `#171824` | `#F5F6FA` |
| `textMuted` | `#5F6473` | `#AEB3C2` |
| `border` | `#D9DCE7` | `#34384A` |
| `primary` | `#4F46E5` | `#A7A2FF` |
| `primaryPressed` | `#4338CA` | `#8D86F2` |
| `onPrimary` | `#FFFFFF` | `#17132E` |
| `primaryContainer` | `#E5E7FF` | `#302B66` |
| `accent` | `#A3E635` | `#B8F34A` |
| `accentContainer` | `#EFFFC9` | `#29370A` |
| `onAccent` | `#1A2E05` | `#172006` |
| `success` | `#247A3D` | `#6CE59A` |
| `warning` | `#9A5700` | `#F6C177` |
| `danger` | `#B42318` | `#FF8A80` |
| `info` | `#2458C6` | `#82B1FF` |

Indigo is the primary button color. Lime is for focus, selection, badges, and small accents, never white-text buttons.

## Foundation Tokens

- Spacing: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Radius: `8` small, `12` medium, `16` large, `999` pill.
- Type: Display `32/40/700`, Title `24/32/700`, Heading `20/28/700`, Body `16/24/400`, Body Small `14/20/400`, Label `14/20/600`, Caption `12/16/400`.
- Android system/Roboto font with system font scaling.
- Icon sizes: `18, 20, 24, 28` from one Material icon family.
- Motion: `120ms` fast, `200ms` standard, `300ms` slow; respect reduced motion.
- Minimum touch target: `48 x 48`.
- Layout: four-point grid, `16px` screen padding, `24px` section gap, `720px` maximum content width.
- Favor borders and flat surfaces over heavy shadows, especially in dark mode.

## Discover Screen

- One vertically scrolling screen; there is no bottom navigation.
- Header contains the Tracksy wordmark and one-sentence instruction.
- Search field and Search button share a row and remain at the top of results.
- Before a manual search, a lime music-note and **Music for you** heading introduce the rotating discovery feed; the search field stays empty.
- Results use text-only rounded cards: two-line title, one-line channel/duration metadata, then an `8px` action gap after a `12px` top margin.
- **Copy & Open** and **Open in YouTube** share one row at equal width.
- **Copy & Open** is primary; **Open in YouTube** is secondary.
- Loading, empty, offline, quota, configuration, and retry states use native themed cards.
- Explicit **Load More** appears below results only when another page exists.

Every state includes text or iconography; color alone never communicates meaning. Light/dark mode follows Android. The attached browser and converter page retain their own appearance.
