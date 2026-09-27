# Tracksy UI Design System

## Status

Final MVP native-interface design contract

Related documents:

- [Product requirements](./PRD.md)
- [Architecture](./ARCHITECTURE.md)
- [Implementation tasks](./TASKS.md)

This document is the visual source of truth for Tracksy's native interface. The PRD defines product behavior, and the architecture defines technical behavior and security boundaries.

## 1. Design direction

Tracksy should feel playful, quick, and trustworthy. Indigo provides the primary interactive identity, while lime adds energy to selection, focus, and small highlights. Soft-rounded surfaces keep the application friendly without competing with video thumbnails or the embedded converter.

Principles:

- Make the next action obvious without making the screen noisy.
- Keep search results compact enough to scan several at once.
- Use native status UI around the untrusted WebView.
- Communicate state with text and icons as well as color.
- Use semantic tokens everywhere; feature code must not introduce one-off visual values.
- Preserve Android conventions for back behavior, touch targets, typography, dialogs, and system theme selection.

Tracksy uses a text wordmark for the MVP. Replacing the Expo placeholder application icon is deferred.

## 2. Theme contract

Tracksy supports light and dark themes and follows the Android system setting. If the system preference cannot be determined, use light theme. Native Tracksy chrome changes theme immediately; the third-party converter page remains visually uncontrolled and must not be restyled with injected CSS.

The implementation must expose these public types:

```ts
export type ThemeName = "light" | "dark";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accent: string;
  accentContainer: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  focus: string;
  overlay: string;
};

export type ThemeTokens = {
  name: ThemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  iconSize: typeof iconSize;
  motion: typeof motion;
  elevation: typeof elevation;
  layout: typeof layout;
};
```

### 2.1 Colors

| Token | Light | Dark | Intended use |
|---|---|---|---|
| `background` | `#F8F9FC` | `#0E0F17` | Screen background |
| `surface` | `#FFFFFF` | `#171925` | Cards, fields, tab bar |
| `surfaceRaised` | `#FFFFFF` | `#202333` | Dialogs and elevated overlays |
| `surfaceMuted` | `#F0F1F7` | `#282B3B` | Disabled and skeleton surfaces |
| `text` | `#171824` | `#F5F6FA` | Primary text |
| `textMuted` | `#5F6473` | `#AEB3C2` | Secondary metadata |
| `border` | `#D9DCE7` | `#34384A` | Dividers, outlines, WebView boundary |
| `primary` | `#4F46E5` | `#A7A2FF` | Primary actions and active controls |
| `primaryPressed` | `#4338CA` | `#8D86F2` | Pressed primary state |
| `onPrimary` | `#FFFFFF` | `#17132E` | Content on primary |
| `primaryContainer` | `#E5E7FF` | `#302B66` | Selected and informational surfaces |
| `onPrimaryContainer` | `#312E81` | `#E7E5FF` | Content on primary container |
| `accent` | `#A3E635` | `#B8F34A` | Focus, badges, and small highlights |
| `accentContainer` | `#EFFFC9` | `#29370A` | Accent surface |
| `onAccent` | `#1A2E05` | `#172006` | Content on accent |
| `success` | `#247A3D` | `#6CE59A` | Success icon and text |
| `warning` | `#9A5700` | `#F6C177` | Warning icon and text |
| `danger` | `#B42318` | `#FF8A80` | Error and destructive content |
| `info` | `#2458C6` | `#82B1FF` | Informational content |
| `focus` | `#4F46E5` | `#B8F34A` | Focus outline |
| `overlay` | `rgba(14, 15, 23, 0.48)` | `rgba(0, 0, 0, 0.64)` | Modal scrim |

Indigo is the only filled primary-button color. Lime must not be paired with white text; use `onAccent` for content on lime.

Status colors are for icons, labels, and outlines on theme surfaces. Do not use them as large filled backgrounds without separately checking foreground contrast.

## 3. Foundation tokens

### 3.1 Spacing

Use a four-point grid:

```ts
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  control: 48,
  section: 64,
} as const;
```

### 3.2 Radius

```ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
```

Use `sm` for thumbnails, `md` for fields and buttons, `lg` for cards and dialogs, and `pill` only for badges and compact status controls.

### 3.3 Typography

Use the Android system/Roboto font. Do not bundle a custom font for the MVP.

| Token | Size / line height | Weight | Use |
|---|---:|---:|---|
| `display` | `32 / 40` | `700` | Rare hero or onboarding text |
| `title` | `24 / 32` | `700` | Screen title |
| `heading` | `20 / 28` | `700` | Section and dialog heading |
| `body` | `16 / 24` | `400` | Primary content |
| `bodySmall` | `14 / 20` | `400` | Metadata and supporting text |
| `label` | `14 / 20` | `600` | Buttons, tabs, and field labels |
| `caption` | `12 / 16` | `400` | Timestamps and compact hints |

Respect Android font scaling. Text containers must grow rather than clip, except video titles may use an explicit two-line limit.

### 3.4 Icons, motion, and elevation

```ts
export const iconSize = { sm: 18, md: 20, lg: 24, xl: 28 } as const;
export const motion = { fast: 120, standard: 200, slow: 300 } as const;
export const elevation = { flat: 0, low: 1, raised: 3 } as const;
```

Use one Material Rounded icon family. Important actions require visible text or an accessible label; icons must not be the only explanation for unfamiliar actions.

Use motion only for state transitions, pressed feedback, and loading continuity. Disable decorative motion and shimmer when Android reduced-motion preferences indicate it.

Prefer borders and tonal separation over heavy shadows, especially in dark mode.

### 3.5 Layout

```ts
export const layout = {
  screenPadding: 16,
  sectionGap: 24,
  maxContentWidth: 720,
  topBarHeight: 56,
  tabBarHeight: 64,
  searchFieldHeight: 52,
  minTouchTarget: 48,
  resultThumbnailWidth: 120,
  resultThumbnailHeight: 68,
} as const;
```

Phone portrait is the primary layout. On wider Android screens, center the content column and cap it at `maxContentWidth`. Bottom navigation adds the device safe-area inset below its base height.

## 4. Component rules

### 4.1 Buttons

- Primary: filled `primary` background with `onPrimary` content.
- Secondary: transparent or surface background with `primary` label and border.
- Tertiary: text/icon action without a container.
- Destructive: outlined by default using `danger`; reserve filled destructive treatment for irreversible confirmation.
- Disabled: `surfaceMuted` with `textMuted` content and no elevation.
- Loading: preserve the button's width, replace the leading icon with progress, and keep an accessible loading label.
- Every button has at least a 48px touch target, `radius.md` corners, and clear pressed and focus states.

### 4.2 Inputs and search

- Search fields are 52px high with `radius.md` corners, a search icon, text label or hint, and a visible focus outline.
- Keep the Search action visible; search never starts on each keystroke.
- Validation and service errors appear below or adjacent to the field as text, not only through border color.
- Do not clear the submitted query when switching tabs or retrying.

### 4.3 Feedback and status

- Status banners combine an icon, short heading, message, and recovery action when applicable.
- Empty and error cards use `surface`, `radius.lg`, a one-pixel border, and centered content.
- Skeletons use `surfaceMuted` and match the final layout dimensions to avoid movement.
- Progress indicators use `primary`; loading also has an accessible text announcement.
- Confirmation dialogs use `surfaceRaised` and name the external destination hostname.

### 4.4 Media rows

- Use a `120 x 68` thumbnail with `radius.sm` and a neutral placeholder when unavailable.
- Place the title beside the thumbnail, limit it to two lines, and show channel plus optional duration beneath it.
- Put **Use Link** first as the filled primary action.
- Present **Open in YouTube** as a labeled secondary or tertiary action with an external/open icon.
- Keep row actions reachable with 48px touch targets without making the entire row implicitly perform an action.

### 4.5 Bottom navigation

- Use exactly two labeled destinations: Discover and Download.
- The base height is 64px plus the bottom safe-area inset.
- Active destination uses `primary` for its icon and label plus a restrained `accent` indicator.
- Inactive destinations use `textMuted`.
- Preserve both tab screens after their first mount.

## 5. Screen blueprints

### 5.1 Discover

Order content as:

1. Safe-area-aware header with the Tracksy text wordmark and short search context.
2. Search field and explicit Search action.
3. Native status region for validation, offline, quota, configuration, and retry messages.
4. Compact result list with 12px row gaps.
5. Explicit Load More action after results when another page exists.

During initial loading, show skeleton media rows. During pagination, preserve current results and show progress beside or inside Load More. Do not cover existing results with a full-screen loader.

### 5.2 Download

Use:

1. A 56px native toolbar with Download title and permanent **Open in browser** action.
2. A native status/banner region for clipboard, loading, injection, and recovery messages.
3. The WebView filling the remaining area with a visible one-pixel boundary.
4. Native overlays for page-loading, offline, unavailable, and renderer-recovery states.

The WebView is third-party content, not a Tracksy surface. Do not recolor, inject theme CSS, hide advertisements, or visually imply that Tracksy operates the converter.

### 5.3 Dialogs and transient feedback

- External navigation confirmation shows the destination hostname and explicit Cancel/Open actions.
- Clipboard failure is non-blocking and uses a compact warning banner.
- Successful autofill uses a short native success message without obscuring the converter.
- Avoid transient-only messages for failures that require user action; keep recovery controls visible until resolved.

## 6. Accessibility and content

- Meet WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for large text, icons, focus indicators, and component boundaries.
- Never communicate status with color alone.
- Supply accessibility names, roles, states, and hints for interactive elements.
- Maintain logical focus order and announce loading, error, and successful autofill state changes.
- Support font scaling without horizontal scrolling or clipped controls.
- Use sentence case for labels and messages.
- Prefer direct labels: **Search**, **Use Link**, **Load More**, **Reload**, and **Open in browser**.
- Do not describe the converter as a Tracksy or YouTube service.

## 7. Implementation rules

- Mirror this contract in a typed shared theme module; do not redefine token objects inside features.
- Components consume semantic tokens rather than palette values or hard-coded measurements.
- Theme-aware styles may be created through hooks or factories, but static token-independent styles should remain outside render functions.
- Add or change tokens here before using new visual values in application code.
- Test both themes for native components. WebView page styling is excluded because Tracksy does not control it.
