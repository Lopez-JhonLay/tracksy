import { useMemo } from "react";

import {
  getSearchLocale,
  useRuntimeConfig,
  type RuntimeConfig,
} from "@/config";
import {
  createYouTubeApiAdapter,
  DiscoverSearchScreen,
} from "@/features/discovery";

function ConfiguredDiscoverRoute({ config }: { config: RuntimeConfig }) {
  const adapter = useMemo(
    () => createYouTubeApiAdapter(config),
    [config],
  );
  const locale = useMemo(
    () => getSearchLocale(config.searchFallback),
    [config.searchFallback],
  );

  return <DiscoverSearchScreen adapter={adapter} locale={locale} />;
}

export default function DiscoverRoute() {
  const runtimeConfig = useRuntimeConfig();

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
