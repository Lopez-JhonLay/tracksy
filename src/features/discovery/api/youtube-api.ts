import { z } from "zod";

import type { RuntimeConfig, SearchLocale } from "@/config";

import type { SearchPage, SearchResult } from "../contracts";
import { parseIso8601Duration } from "../duration";
import { decodeHtmlEntities } from "../html-entities";
import { validateSearchQuery } from "../query";
import { createCanonicalYouTubeUrl } from "../youtube-url";
import {
  createHttpYouTubeApiError,
  createTransportYouTubeApiError,
  YouTubeApiError,
} from "./youtube-api-error";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const SEARCH_RESULT_LIMIT = 20;

const THUMBNAIL_SCHEMA = z.object({ url: z.string() });

const SEARCH_ITEM_SCHEMA = z.object({
  id: z.object({ videoId: z.string() }),
  snippet: z.object({
    title: z.string(),
    channelTitle: z.string(),
    thumbnails: z.object({
      default: THUMBNAIL_SCHEMA.optional(),
      medium: THUMBNAIL_SCHEMA.optional(),
      high: THUMBNAIL_SCHEMA.optional(),
    }),
  }),
});

const SEARCH_RESPONSE_SCHEMA = z.object({
  items: z.array(z.unknown()).default([]),
  nextPageToken: z.string().optional(),
});

const DURATION_ITEM_SCHEMA = z.object({
  id: z.string(),
  contentDetails: z.object({ duration: z.string() }),
});

const DURATION_RESPONSE_SCHEMA = z.object({
  items: z.array(z.unknown()).default([]),
});

export type YouTubeClientConfig = Pick<
  RuntimeConfig,
  "youtubeApiKey" | "androidPackageName" | "androidCertSha1"
>;

export type YouTubeSearchInput = {
  query: string;
  locale: SearchLocale;
  pageToken?: string;
  signal?: AbortSignal;
};

export type YouTubeFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

export type YouTubeApiAdapter = {
  search(input: YouTubeSearchInput): Promise<SearchPage>;
};

export type YouTubeApiAdapterOptions = {
  fetch?: YouTubeFetch;
};

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function getThumbnailUrl(
  thumbnails: z.infer<typeof SEARCH_ITEM_SCHEMA>["snippet"]["thumbnails"],
): string | undefined {
  const candidates = [
    thumbnails.medium?.url,
    thumbnails.high?.url,
    thumbnails.default?.url,
  ];

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && isHttpsUrl(candidate),
  );
}

function normalizeSearchItem(value: unknown): SearchResult | undefined {
  const parsed = SEARCH_ITEM_SCHEMA.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  const { videoId } = parsed.data.id;
  const canonicalUrl = createCanonicalYouTubeUrl(videoId);
  const thumbnailUrl = getThumbnailUrl(parsed.data.snippet.thumbnails);

  if (!canonicalUrl || !thumbnailUrl) {
    return undefined;
  }

  return {
    videoId,
    title: decodeHtmlEntities(parsed.data.snippet.title),
    channelTitle: decodeHtmlEntities(parsed.data.snippet.channelTitle),
    thumbnailUrl,
    canonicalUrl,
  };
}

function getDurationsByVideoId(value: unknown): Map<string, number> {
  const parsed = DURATION_RESPONSE_SCHEMA.safeParse(value);
  if (!parsed.success) {
    throw new YouTubeApiError("unknown", { retryable: true });
  }

  const durations = new Map<string, number>();

  for (const item of parsed.data.items) {
    const parsedItem = DURATION_ITEM_SCHEMA.safeParse(item);
    if (!parsedItem.success) {
      continue;
    }

    const durationSeconds = parseIso8601Duration(
      parsedItem.data.contentDetails.duration,
    );

    if (durationSeconds !== undefined) {
      durations.set(parsedItem.data.id, durationSeconds);
    }
  }

  return durations;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function ensureNotCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new YouTubeApiError("cancelled", { retryable: false });
  }
}

export function createYouTubeApiAdapter(
  config: YouTubeClientConfig,
  options: YouTubeApiAdapterOptions = {},
): YouTubeApiAdapter {
  const fetchRequest: YouTubeFetch =
    options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  const headers = {
    Accept: "application/json",
    "x-goog-api-key": config.youtubeApiKey,
    "X-Android-Package": config.androidPackageName,
    "X-Android-Cert": config.androidCertSha1,
  };

  async function request(url: URL, signal?: AbortSignal): Promise<unknown> {
    ensureNotCancelled(signal);

    let response: Response;
    try {
      response = await fetchRequest(url.toString(), {
        method: "GET",
        headers,
        signal,
      });
    } catch (error) {
      throw createTransportYouTubeApiError(error, signal);
    }

    const body = await readJson(response);
    if (!response.ok) {
      throw createHttpYouTubeApiError(response.status, body);
    }

    if (body === undefined) {
      throw new YouTubeApiError("unknown", { retryable: true });
    }

    return body;
  }

  return {
    async search({ query, locale, pageToken, signal }) {
      const queryValidation = validateSearchQuery(query);
      if (queryValidation.status === "invalid") {
        throw new YouTubeApiError("unknown", { retryable: false });
      }

      const searchUrl = new URL(`${YOUTUBE_API_BASE_URL}/search`);
      searchUrl.searchParams.set("part", "snippet");
      searchUrl.searchParams.set("type", "video");
      searchUrl.searchParams.set("maxResults", String(SEARCH_RESULT_LIMIT));
      searchUrl.searchParams.set("safeSearch", "moderate");
      searchUrl.searchParams.set("q", queryValidation.query);
      searchUrl.searchParams.set("regionCode", locale.regionCode);
      searchUrl.searchParams.set(
        "relevanceLanguage",
        locale.relevanceLanguage,
      );
      searchUrl.searchParams.set(
        "fields",
        "nextPageToken,items(id/videoId,snippet(title,channelTitle,thumbnails(default/url,medium/url,high/url)))",
      );

      if (pageToken) {
        searchUrl.searchParams.set("pageToken", pageToken);
      }

      const searchBody = await request(searchUrl, signal);
      const parsedSearch = SEARCH_RESPONSE_SCHEMA.safeParse(searchBody);
      if (!parsedSearch.success) {
        throw new YouTubeApiError("unknown", { retryable: true });
      }

      const items = parsedSearch.data.items
        .map(normalizeSearchItem)
        .filter((item): item is SearchResult => item !== undefined);

      if (items.length === 0) {
        const nextPageToken = parsedSearch.data.nextPageToken?.trim();
        return {
          items,
          ...(nextPageToken ? { nextPageToken } : {}),
        };
      }

      ensureNotCancelled(signal);

      const videosUrl = new URL(`${YOUTUBE_API_BASE_URL}/videos`);
      videosUrl.searchParams.set("part", "contentDetails");
      videosUrl.searchParams.set(
        "id",
        items.map(({ videoId }) => videoId).join(","),
      );
      videosUrl.searchParams.set("fields", "items(id,contentDetails/duration)");

      const durationBody = await request(videosUrl, signal);
      const durations = getDurationsByVideoId(durationBody);
      const enrichedItems = items.map((item) => {
        const durationSeconds = durations.get(item.videoId);
        return durationSeconds === undefined
          ? item
          : { ...item, durationSeconds };
      });
      const nextPageToken = parsedSearch.data.nextPageToken?.trim();

      return {
        items: enrichedItems,
        ...(nextPageToken ? { nextPageToken } : {}),
      };
    },
  };
}
