import {
  infiniteQueryOptions,
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";

import type { SearchLocale } from "@/config";

import {
  isYouTubeApiError,
  type YouTubeApiAdapter,
  type YouTubeApiError,
} from "../api";
import type { SearchPage, SearchResult } from "../contracts";
import { validateSearchQuery } from "../query";

export const DISCOVERY_CACHE_TIME_MS = 5 * 60 * 1000;

export type DiscoveryPageParam = string | undefined;

export type DiscoverySearchQueryKey = readonly [
  "discovery",
  "search",
  string,
  string,
  string,
];

export type DiscoverySearchData = {
  items: SearchResult[];
  pageCount: number;
};

export type DiscoverySearchOptions = {
  adapter: YouTubeApiAdapter;
  query: string;
  locale: SearchLocale;
  enabled?: boolean;
};

export function createDiscoverySearchQueryKey(
  query: string,
  locale: SearchLocale,
): DiscoverySearchQueryKey {
  return [
    "discovery",
    "search",
    query.trim(),
    locale.regionCode,
    locale.relevanceLanguage,
  ];
}

export function selectDiscoverySearchData(
  data: InfiniteData<SearchPage, DiscoveryPageParam>,
): DiscoverySearchData {
  const seenVideoIds = new Set<string>();
  const items: SearchResult[] = [];

  for (const page of data.pages) {
    for (const item of page.items) {
      if (seenVideoIds.has(item.videoId)) {
        continue;
      }

      seenVideoIds.add(item.videoId);
      items.push(item);
    }
  }

  return { items, pageCount: data.pages.length };
}

export function shouldRetryDiscoverySearch(
  failureCount: number,
  error: unknown,
): boolean {
  return (
    failureCount < 1 && isYouTubeApiError(error) && error.retryable
  );
}

export function createDiscoverySearchQueryOptions({
  adapter,
  query,
  locale,
  enabled = true,
}: DiscoverySearchOptions) {
  const validation = validateSearchQuery(query);
  const normalizedQuery =
    validation.status === "valid" ? validation.query : query.trim();

  return infiniteQueryOptions<
    SearchPage,
    YouTubeApiError,
    DiscoverySearchData,
    DiscoverySearchQueryKey,
    DiscoveryPageParam
  >({
    queryKey: createDiscoverySearchQueryKey(normalizedQuery, locale),
    queryFn: ({ pageParam, signal }) =>
      adapter.search({
        query: normalizedQuery,
        locale,
        pageToken: pageParam,
        signal,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    select: selectDiscoverySearchData,
    enabled: enabled && validation.status === "valid",
    staleTime: DISCOVERY_CACHE_TIME_MS,
    gcTime: DISCOVERY_CACHE_TIME_MS,
    retry: shouldRetryDiscoverySearch,
  });
}

export function useDiscoverySearch(
  options: DiscoverySearchOptions,
): UseInfiniteQueryResult<DiscoverySearchData, YouTubeApiError> {
  return useInfiniteQuery(createDiscoverySearchQueryOptions(options));
}
