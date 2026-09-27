# Tracksy Agent Guide

This file defines the default working rules for every Tracksy development session. Read [the product requirements](docs/PRD.md) and [the architecture](docs/ARCHITECTURE.md) before changing product behavior or technical boundaries. Those documents are the source of truth for detailed requirements and architecture decisions.

## Project baseline

Tracksy is an Android-only application supporting Android 10 and newer. It uses Expo, React Native, TypeScript, Expo Router, TanStack Query, Zustand, React Native WebView, pnpm, EAS Build, Jest with React Native Testing Library, and Maestro.

Do not spend time preserving iOS or web compatibility unless the task explicitly requests it.

Use this project structure as features are introduced:

```text
app/                    Expo Router routes and layouts
src/features/           Feature-owned UI, hooks, services, and types
src/                    Shared configuration, providers, stores, and utilities
e2e/                    Maestro flows and fixtures
```

Keep unit and component tests beside the code they cover as `*.test.ts` or `*.test.tsx`. Use the `@/` alias for application-source imports once it is configured. Features may consume another feature's public interface but must not import its internal modules directly.

## Expo and dependencies

Expo and React Native APIs change between SDK releases. Before changing Expo, React Native, or EAS APIs:

1. Check the installed `expo` version in `package.json`.
2. Consult the matching version at `https://docs.expo.dev/versions/v<major>.0.0/`.
3. Use `https://docs.expo.dev/llms.txt` to locate current official guidance when the versioned reference is insufficient.

Prefer existing dependencies and Expo-maintained modules. Add a package only when it clearly reduces implementation risk or complexity. Confirm compatibility with the installed Expo SDK, use `pnpm exec expo install` for Expo-compatible packages, and report added dependencies in the final handoff.

When native `android/` and `ios/` directories are absent, Expo Continuous Native Generation owns them. Never create or edit them manually; use Expo configuration and config plugins.

## Commands

Run commands from the repository root.

```bash
pnpm start                              # Start the Expo development server
pnpm android                            # Start Expo and open the Android target
pnpm lint                               # Run ESLint
pnpm exec tsc --noEmit                  # Run the TypeScript compiler
pnpm dlx expo-doctor@latest             # Validate Expo dependencies and configuration
pnpm exec expo install <package>        # Install an Expo-compatible package
pnpm dlx eas-cli@latest <command>       # Run EAS commands
```

Use the repository's test scripts once they are present. Do not substitute npm, Yarn, or Bun commands for pnpm commands, and keep `pnpm-lock.yaml` synchronized with dependency changes.

## Code conventions

- Keep TypeScript strict. Avoid `any`; validate unknown external data before narrowing it.
- Use function components and hooks. Keep screens focused on composition and move feature behavior into feature-owned hooks, services, or utilities.
- Use React Native components and `StyleSheet`; do not add a UI framework without an architecture decision.
- Design for Android behavior, performance, back navigation, and accessibility. Controls must have accessible names and appropriately sized touch targets.
- Keep YouTube server state in TanStack Query. Keep only session-scoped cross-tab handoff state in Zustand.
- Do not add persistence, authentication, a backend, analytics, a custom downloader, or other out-of-scope infrastructure without first updating the architecture decision.
- Keep secrets and environment-specific values out of source control. Public client configuration must still be treated as extractable and must not be described as secret storage.
- Prefer small, feature-focused changes. Reuse existing contracts and utilities rather than duplicating behavior.

## Security and product guardrails

- Treat YouTube API responses and all converter content, navigation, redirects, downloads, and messages as untrusted input.
- Allow silent converter navigation and injection only for the exact trusted origin defined in the architecture. Validate every WebView message at runtime.
- Never expose API keys, signing data, or application configuration to the converter WebView.
- Never log credentials, full API request URLs, clipboard contents, selected URLs, injected scripts, converter messages, or download URLs.
- Never submit the converter form or activate Convert automatically. Do not add DRM bypass, authentication bypass, restricted-content handling, or batch conversion.
- Preserve the documented manual-paste, reload, and external-browser fallbacks when converter behavior fails.
- Use only media the user owns or is authorized to process in tests and manual verification.

## Working-tree and documentation rules

- Inspect the working tree before editing. Preserve unrelated user changes and do not overwrite or revert them.
- Do not create commits, amend commits, push branches, or otherwise publish changes unless the user explicitly requests it.
- Update `docs/PRD.md` and/or `docs/ARCHITECTURE.md` in the same task when implementation changes documented product behavior, scope, public contracts, security policy, or architectural decisions.
- Do not duplicate detailed product contracts in this file. Link to the source-of-truth documentation instead.

## Definition of done

For every code task:

1. Run `pnpm lint` and `pnpm exec tsc --noEmit`.
2. Run relevant unit and component tests for the affected behavior.
3. Run `pnpm dlx expo-doctor@latest` after dependency, Expo configuration, or native-integration changes.
4. Run Android or Maestro verification when changing navigation, WebView, clipboard, linking, download handling, or an end-to-end flow.
5. Confirm that logs and errors do not expose protected or user-provided values.

For documentation-only tasks, verify Markdown structure, internal file references, command accuracy, and UTF-8 rendering.

If a required check cannot run, do not claim it passed. Report the exact blocker and the remaining verification in the final handoff.

