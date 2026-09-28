# Tracksy Android smoke flow

The smoke flow requires the internally distributed `e2e` APK. That profile
enables deterministic search and converter fixtures; development and preview
builds continue to use their normal adapters.

Prerequisites:

- Maestro CLI with Java 17 or 21.
- One Android emulator or device visible through `adb devices`.
- The Tracksy `e2e` APK installed on that device.

Build and run:

```bash
pnpm dlx eas-cli@latest build --platform android --profile e2e
maestro test e2e/tracksy-smoke.yaml
```

The flow searches deterministic fixtures, sends two different links to the
converter, verifies replacement, and confirms that Tracksy never activates
Convert automatically.
