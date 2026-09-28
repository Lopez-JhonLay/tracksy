import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import {
  getSearchLocale,
  testAdaptersEnabled,
  useRuntimeConfig,
  type RuntimeConfig,
} from "@/config";
import {
  sendVideoToConverter,
  type UseVideoLink,
} from "@/features/converter";
import {
  createYouTubeApiAdapter,
  DiscoverSearchScreen,
} from "@/features/discovery";
import { createFakeYouTubeApiAdapter } from "@/features/discovery/testing";
import { useConverterHandoffStore } from "@/store";

const TEST_RUNTIME_CONFIG: RuntimeConfig = {
  androidCertSha1: "0000000000000000000000000000000000000000",
  androidPackageName: "com.jhonlaylopez.tracksy",
  searchFallback: {
    regionCode: "PH",
    relevanceLanguage: "en",
  },
  youtubeApiKey: "test-adapter",
};

function ConfiguredDiscoverRoute({ config }: { config: RuntimeConfig }) {
  const router = useRouter();
  const sendToConverter = useConverterHandoffStore(
    (state) => state.sendToConverter,
  );
  const adapter = useMemo(
    () =>
      testAdaptersEnabled
        ? createFakeYouTubeApiAdapter()
        : createYouTubeApiAdapter(config),
    [config],
  );
  const locale = useMemo(
    () => getSearchLocale(config.searchFallback),
    [config.searchFallback],
  );
  const handleUseLink = useCallback<UseVideoLink>(
    (result) =>
      sendVideoToConverter(result, {
        copyToClipboard: Clipboard.setStringAsync,
        navigateToDownload: () => router.navigate("/download"),
        sendToConverter,
      }),
    [router, sendToConverter],
  );

  return (
    <DiscoverSearchScreen
      adapter={adapter}
      locale={locale}
      useLink={handleUseLink}
    />
  );
}

export default function DiscoverRoute() {
  const runtimeConfig = useRuntimeConfig();

  if (testAdaptersEnabled) {
    return (
      <ConfiguredDiscoverRoute config={TEST_RUNTIME_CONFIG} />
    );
  }

  if (runtimeConfig.status === "invalid") {
    return (
      <DiscoverSearchScreen
        adapter={null}
        locale={getSearchLocale()}
      />
    );
  }

  return <ConfiguredDiscoverRoute config={runtimeConfig.config} />;
}
