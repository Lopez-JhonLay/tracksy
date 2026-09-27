import type { SearchLocale } from "./runtime-config";

export type DeviceLocale = {
  languageCode?: string | null;
  languageTag?: string | null;
  regionCode?: string | null;
};

function resolveRegion(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

function resolveLanguage(locale: DeviceLocale | undefined): string | undefined {
  const candidate = locale?.languageCode ?? locale?.languageTag?.split("-")[0];
  const normalized = candidate?.trim().toLowerCase();
  return normalized && /^[a-z]{2,3}$/.test(normalized) ? normalized : undefined;
}

export function resolveSearchLocale(
  locale: DeviceLocale | undefined,
  fallback: SearchLocale = {
    regionCode: "PH",
    relevanceLanguage: "en",
  },
): SearchLocale {
  return {
    regionCode: resolveRegion(locale?.regionCode) ?? fallback.regionCode,
    relevanceLanguage:
      resolveLanguage(locale) ?? fallback.relevanceLanguage,
  };
}
