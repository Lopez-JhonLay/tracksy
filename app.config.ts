import type { ConfigContext, ExpoConfig } from "expo/config";

export type TracksyBuildEnvironment = {
  EAS_BUILD_PROFILE?: string;
  TRACKSY_ENABLE_TEST_ADAPTERS?: string;
};

export function areTestAdaptersEnabledForBuild(
  environment: TracksyBuildEnvironment,
): boolean {
  return (
    environment.EAS_BUILD_PROFILE === "e2e" &&
    environment.TRACKSY_ENABLE_TEST_ADAPTERS === "1"
  );
}

export function createTracksyAppConfig(
  config: Partial<ExpoConfig>,
  environment: TracksyBuildEnvironment,
): Partial<ExpoConfig> {
  return {
    ...config,
    extra: {
      ...config.extra,
      tracksyTestAdaptersEnabled:
        areTestAdaptersEnabledForBuild(environment),
    },
  };
}

export default ({ config }: ConfigContext): ExpoConfig =>
  createTracksyAppConfig(config, {
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE,
    TRACKSY_ENABLE_TEST_ADAPTERS:
      process.env.TRACKSY_ENABLE_TEST_ADAPTERS,
  }) as ExpoConfig;
