import * as Clipboard from "expo-clipboard";
import { useCallback, useMemo } from "react";

import { getSearchLocale, useRuntimeConfig, type RuntimeConfig } from "@/config";
import {
  CONVERTER_URL,
  copyAndOpenVideo,
  openInSystemBrowser,
  type UseVideoLink,
} from "@/features/converter";
import {
  createYouTubeApiAdapter,
  DiscoverSearchScreen,
  pickRandomMusicQuery,
} from "@/features/discovery";

function ConfiguredDiscoverRoute({ config }: { config: RuntimeConfig }) {
  const adapter = useMemo(() => createYouTubeApiAdapter(config), [config]);
  const locale = useMemo(
    () => getSearchLocale(config.searchFallback),
    [config.searchFallback],
  );
  const initialQuery = useMemo(() => pickRandomMusicQuery(), []);
  const handleUseLink = useCallback<UseVideoLink>(
    (result) =>
      copyAndOpenVideo(result, {
        copyToClipboard: Clipboard.setStringAsync,
        openConverter: () => openInSystemBrowser(CONVERTER_URL),
      }),
    [],
  );

  return (
    <DiscoverSearchScreen
      adapter={adapter}
      initialQuery={initialQuery}
      locale={locale}
      useLink={handleUseLink}
    />
  );
}

export default function DiscoverRoute() {
  const runtimeConfig = useRuntimeConfig();

  if (runtimeConfig.status === "invalid") {
    return <DiscoverSearchScreen adapter={null} locale={getSearchLocale()} />;
  }

  return <ConfiguredDiscoverRoute config={runtimeConfig.config} />;
}
