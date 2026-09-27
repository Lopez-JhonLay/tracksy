import { z } from "zod";

export const ANDROID_PACKAGE_NAME = "com.jhonlaylopez.tracksy";

export type SearchLocale = {
  regionCode: string;
  relevanceLanguage: string;
};

export type RuntimeConfig = {
  youtubeApiKey: string;
  androidPackageName: typeof ANDROID_PACKAGE_NAME;
  androidCertSha1: string;
  searchFallback: SearchLocale;
};

export type RuntimeConfigField = "youtubeApiKey" | "androidCertSha1";

export type RuntimeConfigResult =
  | { status: "ready"; config: RuntimeConfig }
  | { status: "invalid"; invalidFields: RuntimeConfigField[] };

export type PublicEnvironment = {
  youtubeApiKey?: string;
  androidCertSha1?: string;
  searchFallbackRegion?: string;
  searchFallbackLanguage?: string;
};

const REQUIRED_CONFIG_SCHEMA = z.object({
  youtubeApiKey: z.string().trim().min(1),
  androidCertSha1: z
    .string()
    .trim()
    .regex(/^(?:[A-Fa-f0-9]{40}|(?:[A-Fa-f0-9]{2}:){19}[A-Fa-f0-9]{2})$/),
});

function normalizeRegion(value: string | undefined, fallback: string): string {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : fallback;
}

function normalizeLanguage(value: string | undefined, fallback: string): string {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^[a-z]{2,3}$/.test(normalized) ? normalized : fallback;
}

export function parseRuntimeConfig(
  environment: PublicEnvironment,
): RuntimeConfigResult {
  const parsed = REQUIRED_CONFIG_SCHEMA.safeParse(environment);

  if (!parsed.success) {
    const invalidFields = Array.from(
      new Set(
        parsed.error.issues
          .map((issue) => issue.path[0])
          .filter(
            (field): field is RuntimeConfigField =>
              field === "youtubeApiKey" || field === "androidCertSha1",
          ),
      ),
    );

    return { status: "invalid", invalidFields };
  }

  return {
    status: "ready",
    config: {
      youtubeApiKey: parsed.data.youtubeApiKey,
      androidPackageName: ANDROID_PACKAGE_NAME,
      androidCertSha1: parsed.data.androidCertSha1
        .replaceAll(":", "")
        .toUpperCase(),
      searchFallback: {
        regionCode: normalizeRegion(environment.searchFallbackRegion, "PH"),
        relevanceLanguage: normalizeLanguage(
          environment.searchFallbackLanguage,
          "en",
        ),
      },
    },
  };
}

export const runtimeConfig = parseRuntimeConfig({
  youtubeApiKey: process.env.EXPO_PUBLIC_YOUTUBE_API_KEY,
  androidCertSha1: process.env.EXPO_PUBLIC_ANDROID_CERT_SHA1,
  searchFallbackRegion: process.env.EXPO_PUBLIC_SEARCH_FALLBACK_REGION,
  searchFallbackLanguage: process.env.EXPO_PUBLIC_SEARCH_FALLBACK_LANGUAGE,
});
