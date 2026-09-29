# Tracksy MVP Tasks

This tracker reflects the current single-screen, browser-first MVP. Detailed behavior lives in [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [UI-DESIGN.md](./UI-DESIGN.md).

- Work on the first unchecked task unless the user selects another.
- Include tests with the behavior they verify and check a task only after its checks pass.
- The user reviews, commits, and pushes. Agents never commit automatically.
- Never record credentials, API keys, certificates, or private test data.

## Completed Foundation and Discovery

- [x] 1. Scaffold the Expo TypeScript app. Commit: `ec00663`.
- [x] 2. Define product, architecture, and agent standards. Commits: `1a327f7`, `d7e3ba7`.
- [x] 3. Add the Tracksy light/dark design system. Commit: `feat: add Tracksy design system`.
- [x] 4. Add Expo Router, application providers, `@/` imports, and Android/EAS configuration. Commit: `chore: add application foundations`.
- [x] 5. Add runtime configuration, locale fallback, and Jest/React Native Testing Library. Commit: `test: add unit and component test setup`.
- [x] 6. Add discovery contracts, validation, canonical URLs, entity decoding, and duration parsing. Commit: `feat: add discovery domain utilities`.
- [x] 7. Add the YouTube API adapter and typed failure mapping. Commit: `feat: add YouTube search adapter`.
- [x] 8. Add TanStack Query session caching, cancellation, explicit pagination, and deduplication. Commit: `feat: add discovery query state`.
- [x] 9. Build the Discover search UI and all loading, empty, error, and retry states. Commit: `feat: build Discover search screen`.
- [x] 10. Add explicit Load More and result metadata. Commit: `feat: add discovery pagination`.
- [x] 11. Add Open in YouTube with Android linking fallback. Commit: `feat: open discovery results externally`.
- [x] 12. Add clipboard plus attached-browser converter handoff. Commit: `feat: open converter from discovery`.

The earlier embedded Download/WebView implementation was retired after device testing established the attached-browser flow as the MVP.

## Current Simplification

- [x] 13. Remove Download navigation, WebView/session state, obsolete dependencies, and deterministic embedded-converter adapters; add the rotating initial music feed; align documentation with the one-screen flow.
  - Verification: focused and complete tests, lint, TypeScript, theme/config checks, Expo Doctor, and manual Expo Go smoke test.
  - Commit: `feat: simplify Tracksy discovery flow`

## Release

- [x] 14. **Manual:** Configure separate development and preview YouTube keys with package/SHA-1/API restrictions, quotas, and alerts.
  - Commit: N/A; never record credential values.

- [x] 15. Add the original Tracksy music mascot and replace the legacy, adaptive, monochrome, splash, and favicon assets.
  - Verification: inspect transparency, safe-area padding, resolved Expo configuration, Expo Doctor, and visual approval.
  - Commit: `feat: add Tracksy mascot app icon`

- [x] 16. **Manual:** Verify real search, Load More, YouTube linking, Copy & Open, manual paste, and light/dark behavior on the target Android 16 device.
  - Verification: all acceptance checks passed in the installed preview APK. Android 10 remains configured as the minimum but has not been device-tested.
  - Commit: `docs: record MVP verification`.

- [x] 17. **Manual:** Build and install the EAS preview APK and complete the MVP acceptance flow.
  - Verification: preview build completed without errors; installation, launcher mascot, startup feed, search, pagination, external actions, clipboard paste, and both themes passed on Android 16.
  - Commit: `docs: record MVP verification` only if verification results are recorded.

The MVP is complete when Tasks 1-17 are checked. Checking a task never grants permission to commit or push.
