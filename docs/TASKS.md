# Tracksy MVP Tasks

This is the ordered implementation tracker for the Tracksy MVP. Product behavior and technical contracts remain defined in [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [UI-DESIGN.md](./UI-DESIGN.md).

## How to use this tracker

- Work on the first unchecked task whose dependencies are complete unless the user selects another task.
- Keep each task focused enough for one commit and include its tests in the same change.
- Mark a task complete only after its implementation and listed verification pass.
- Update its checkbox within the same change prepared for commit.
- Use the suggested Conventional Commit message unless the completed work requires a more accurate scope.
- Agents must not commit or push automatically. The user reviews, commits, and pushes manually.
- Never record API keys, certificates, credentials, or private test data here.
- Manual tasks do not require empty commits. Use the stated commit only when repository files change.

Suggested commit for adding this tracker:

```text
docs: add MVP implementation tracker
```

## Baseline

- [x] 1. Scaffold the Expo TypeScript application.
  - Verification: Blank Expo application, pnpm lockfile, TypeScript, lint, and Expo Doctor checks completed.
  - Commit: `ec00663` (existing)

- [x] 2. Finalize the PRD and architecture.
  - Verification: MVP scope, runtime flow, interfaces, security boundaries, testing, and release approach documented.
  - Commit: `1a327f7` (existing)

- [x] 3. Define persistent agent standards.
  - Verification: Stack, commands, conventions, guardrails, Git rules, and definition of done documented.
  - Commit: `d7e3ba7` (existing)

## Foundation

- [x] 4. Implement the documented light and dark theme tokens, theme provider, reusable primitives, and system-theme behavior.
  - Verification: Test token contracts and theme selection, render representative primitives in both themes, then run lint and type-check.
  - Commit: `feat: add Tracksy design system`

- [x] 5. Convert the blank entrypoint to Expo Router with persistent Discover and Download tabs.
  - Verification: Run lint and type-check, then smoke-test both routes and tab switching on Android.
  - Commit: `feat: add Tracksy tab navigation`

- [x] 6. Add the shared application structure, `@/` alias, Query client, safe-area provider, and session-store foundation.
  - Verification: Run lint, type-check, and a provider render test.
  - Commit: `chore: add application foundations`

- [x] 7. Add the required Expo-compatible dependencies for querying, state, WebView, clipboard, linking, localization, network state, and runtime schemas.
  - Verification: Validate the lockfile, then run Expo Doctor, lint, and type-check.
  - Commit: `chore: install Tracksy runtime dependencies`

- [x] 8. Add public environment configuration, startup validation, locale fallback, and a placeholder-only `.env.example`.
  - Verification: Run configuration and locale unit tests, lint, and type-check.
  - Commit: `feat: add runtime configuration`

- [x] 9. Configure Android 10 minimum support and EAS development and preview APK profiles without generating native directories.
  - Verification: Inspect the resolved Expo configuration and run Expo Doctor.
  - Commit: `build: configure Android and EAS profiles`

- [x] 10. Add Jest and React Native Testing Library with pnpm test scripts and shared mocks.
  - Verification: Run the sample test, complete test command, lint, and type-check.
  - Commit: `test: add unit and component test setup`

## Discovery

- [x] 11. Add discovery contracts and utilities for query validation, canonical URLs, locale resolution, HTML entity decoding, and ISO-8601 durations.
  - Verification: Run focused unit tests for valid, invalid, missing, and fallback inputs, then lint and type-check.
  - Commit: `feat: add discovery domain utilities`

- [x] 12. Implement the YouTube API adapter with restricted headers, explicit search parameters, duration enrichment, cancellation, response normalization, and typed errors.
  - Verification: Run mocked adapter tests only; automated tests must not call YouTube.
  - Commit: `feat: add YouTube search adapter`

- [ ] 13. Implement the TanStack infinite-query layer with session caching, explicit pagination, deduplication, and retry rules.
  - Verification: Run pagination, cancellation, retry, caching, and deduplication tests.
  - Commit: `feat: add discovery query state`

- [ ] 14. Build the Discover search form and result list with loading, empty, offline, quota, configuration, and retry states.
  - Verification: Run component tests for every state, lint, and type-check.
  - Commit: `feat: build Discover search screen`

- [ ] 15. Add explicit Load More behavior and result metadata presentation, including optional durations.
  - Verification: Run tests for disabled and loading behavior, page appending, duplicate results, and missing durations.
  - Commit: `feat: add discovery pagination`

- [ ] 16. Add the Open in YouTube action through Android linking with browser fallback behavior.
  - Verification: Run mocked linking tests and an Android smoke test with and without the YouTube app available.
  - Commit: `feat: open discovery results externally`

## Converter handoff

- [ ] 17. Implement the session-only Zustand handoff store with unique request IDs and guarded clearing.
  - Verification: Run unit tests for repeated selections, request-ID uniqueness, matching clears, and stale clears.
  - Commit: `feat: add converter handoff state`

- [ ] 18. Connect Use Link to the store, Android clipboard, and Download-tab navigation.
  - Verification: Run component tests for a successful handoff and a non-blocking clipboard failure.
  - Commit: `feat: send video links to converter`

## Converter WebView

- [ ] 19. Implement the injection builder, exact-origin checks, native input setter, input events, and validated result schema.
  - Verification: Run unit tests for escaping, success, every failure status, invalid messages, and origin mismatch.
  - Commit: `feat: add converter URL injection`

- [ ] 20. Implement the main-frame navigation policy for trusted, external, HTTP, unsafe-scheme, and popup requests.
  - Verification: Run policy tests for every allowed, confirmed, and blocked destination class.
  - Commit: `feat: enforce converter navigation policy`

- [ ] 21. Build the lazy, session-mounted Download WebView with secure Android settings and request-ID remounting.
  - Verification: Run WebView configuration and replacement-handoff tests, lint, type-check, and an Android smoke test.
  - Commit: `feat: build converter WebView`

- [ ] 22. Connect injection lifecycle handling and matching-request success clearing.
  - Verification: Run tests for filled, wrong-origin, missing-field, script-error, duplicate, and stale-message cases.
  - Commit: `feat: connect converter autofill flow`

- [ ] 23. Add native loading, offline, page-error, renderer-recovery, reload, and manual-paste states.
  - Verification: Run component tests for every state and recovery action.
  - Commit: `feat: add converter recovery states`

- [ ] 24. Add external-navigation confirmation, permanent browser fallback, and best-effort Android download handling.
  - Verification: Run tests for blocked schemes, confirmation, browser linking, and download fallback, then smoke-test on Android.
  - Commit: `feat: add converter browser fallback`

## End-to-end and release

- [ ] 25. Add build-time fake search and converter adapters that cannot be enabled in preview builds.
  - Verification: Confirm deterministic fixtures work in tests and the resolved preview configuration excludes the fake adapters.
  - Commit: `test: add deterministic test adapters`

- [ ] 26. Add Maestro coverage for search, Use Link, autofill without submission, and replacement selection.
  - Verification: Run the complete deterministic flow on Android and confirm Convert is never activated automatically.
  - Commit: `test: add Tracksy Android smoke flow`

- [ ] 27. **Manual:** Configure separate development and preview YouTube keys, package and SHA-1 restrictions, API restrictions, quotas, and alerts.
  - Verification: Confirm each build can search with its matching key and rejects an unmatched package or signing identity.
  - Commit: N/A. Never record credential values.

- [ ] 28. **Manual:** Verify real search, locale behavior, linking, converter autofill, failure recovery, navigation blocking, and fallback downloads on Android 10 and one current Android version.
  - Verification: Complete the architecture's manual-device checklist using only authorized media.
  - Commit: N/A unless verification documentation changes.

- [ ] 29. **Manual:** Build and install the EAS preview APK, confirm debugging and fake adapters are disabled, and complete the MVP acceptance flow.
  - Verification: From a visible result, reach the converter with the correct URL filled in one tap without automatic submission.
  - Commit: `docs: record MVP verification` only if results are recorded in the repository.

## MVP completion

The MVP is complete when tasks 1 through 29 are checked and the final preview APK satisfies the success measure in the PRD. Checking a task never grants an agent permission to commit or push.

