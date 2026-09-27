import { getLocales } from "expo-localization";

import { resolveSearchLocale } from "./locale";
import type { SearchLocale } from "./runtime-config";

export function getSearchLocale(fallback?: SearchLocale): SearchLocale {
  return resolveSearchLocale(getLocales()[0], fallback);
}
