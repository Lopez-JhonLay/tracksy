import Constants from "expo-constants";

export type TracksyRuntimeExtra = {
  tracksyTestAdaptersEnabled?: unknown;
};

export function resolveTestAdaptersEnabled(
  extra: TracksyRuntimeExtra | undefined,
): boolean {
  return extra?.tracksyTestAdaptersEnabled === true;
}

export const testAdaptersEnabled = resolveTestAdaptersEnabled(
  Constants.expoConfig?.extra,
);
