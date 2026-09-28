import appConfig, {
  areTestAdaptersEnabledForBuild,
  createTracksyAppConfig,
} from "./app.config";

const BASE_CONFIG = {
  name: "Tracksy",
  slug: "tracksy",
};

describe("Tracksy build configuration", () => {
  it("enables deterministic adapters only for an explicitly enabled E2E build", () => {
    expect(
      areTestAdaptersEnabledForBuild({
        EAS_BUILD_PROFILE: "e2e",
        TRACKSY_ENABLE_TEST_ADAPTERS: "1",
      }),
    ).toBe(true);
  });

  it.each(["preview", "development", "production", undefined])(
    "cannot enable deterministic adapters for the %s profile",
    (profile) => {
      expect(
        areTestAdaptersEnabledForBuild({
          EAS_BUILD_PROFILE: profile,
          TRACKSY_ENABLE_TEST_ADAPTERS: "1",
        }),
      ).toBe(false);
    },
  );

  it("writes an explicit false value into resolved preview configuration", () => {
    const config = createTracksyAppConfig(BASE_CONFIG, {
      EAS_BUILD_PROFILE: "preview",
      TRACKSY_ENABLE_TEST_ADAPTERS: "1",
    });

    expect(config.extra?.tracksyTestAdaptersEnabled).toBe(false);
  });

  it("keeps Expo's default export compatible with config resolution", () => {
    expect(
      appConfig({
        config: BASE_CONFIG,
        projectRoot: "C:/tracksy",
        staticConfigPath: "C:/tracksy/app.json",
        packageJsonPath: "C:/tracksy/package.json",
      }),
    ).toMatchObject(BASE_CONFIG);
  });
});
