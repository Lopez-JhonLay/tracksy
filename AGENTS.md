# Tracksy Agent Guide

Read [the PRD](docs/PRD.md), [architecture](docs/ARCHITECTURE.md), [UI guide](docs/UI-DESIGN.md), and [task tracker](docs/TASKS.md) before changing their areas of authority.

## Baseline

Tracksy is a single-screen Android 10+ Expo/React Native app using TypeScript, Expo Router, TanStack Query, Expo Clipboard, Expo WebBrowser, pnpm, EAS, Jest, and React Native Testing Library. iOS and web compatibility are not MVP requirements.

Use `app/` for routes, `src/features/` for feature-owned code, and other `src/` folders for shared configuration, providers, and theme code. Colocate `*.test.ts(x)` files. Import shared application code with `@/`; consume features through public exports.

## Commands

```bash
pnpm start
pnpm android
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm dlx expo-doctor@latest
pnpm exec expo install <package>
pnpm dlx eas-cli@latest <command>
```

Before changing Expo, React Native, or EAS APIs, check the installed Expo SDK and its matching official documentation. Prefer existing dependencies and Expo-maintained modules. Explain any added dependency and keep `pnpm-lock.yaml` synchronized. Never manually create or edit generated `android/` or `ios/` directories.

## Conventions and Guardrails

- Keep TypeScript strict; validate unknown external input before narrowing it.
- Use function components, hooks, React Native components, `StyleSheet`, semantic theme tokens, accessible names, and 48px minimum touch targets.
- Keep YouTube server state in TanStack Query. Do not add persistence, authentication, a backend, analytics, embedded WebViews, or custom downloading without an architecture decision.
- Treat YouTube responses and converter content as untrusted.
- Never log credentials, full API request URLs, clipboard contents, selected URLs, or converter URLs.
- Never automate paste/submission or implement DRM, authentication, access-control, or restricted-content bypasses.
- Preserve unrelated working-tree changes. Never commit or push automatically.
- Synchronize the PRD, architecture, UI guide, and tracker when implementation changes documented behavior.

## Definition of Done

Every code task runs lint, TypeScript, and relevant tests. Run Expo Doctor after dependency, Expo configuration, or native-integration changes. Manually verify Android when navigation, clipboard, linking, attached-browser, or end-to-end behavior changes. If a check cannot run, report the exact reason and remaining verification.

Documentation-only changes require valid Markdown, working internal references, accurate commands, and UTF-8 text.
