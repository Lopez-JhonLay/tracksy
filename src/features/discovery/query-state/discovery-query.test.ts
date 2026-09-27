import {
  InfiniteQueryObserver,
  QueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import type { SearchPage, SearchResult } from "../contracts";
import { YouTubeApiError, type YouTubeApiAdapter } from "../api";
import {
  createDiscoverySearchQueryKey,
  createDiscoverySearchQueryOptions,
  DISCOVERY_CACHE_TIME_MS,
  selectDiscoverySearchData,
  shouldRetryDiscoverySearch,
  type DiscoveryPageParam,
} from "./discovery-query";

const LOCALE = { regionCode: "PH", relevanceLanguage: "en" };

function result(videoId: string): SearchResult {
  return {
    videoId,
    title: `Title ${videoId}`,
    channelTitle: "Channel",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function createAdapter(
  search: YouTubeApiAdapter["search"],
): YouTubeApiAdapter {
  return { search };
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe("discovery query state", () => {
  it("keys cached searches by normalized query and locale", () => {
    expect(createDiscoverySearchQueryKey("  lo-fi  ", LOCALE)).toEqual([
      "discovery",
      "search",
      "lo-fi",
      "PH",
      "en",
    ]);
    expect(
      createDiscoverySearchQueryKey("lo-fi", {
        regionCode: "US",
        relevanceLanguage: "en",
      }),
    ).not.toEqual(createDiscoverySearchQueryKey("lo-fi", LOCALE));
  });

  it("deduplicates accumulated pages by videoId in first-seen order", () => {
    const data: InfiniteData<SearchPage, DiscoveryPageParam> = {
      pages: [
        { items: [result("one"), result("two")], nextPageToken: "NEXT" },
        { items: [result("two"), result("three")] },
      ],
      pageParams: [undefined, "NEXT"],
    };

    expect(selectDiscoverySearchData(data)).toEqual({
      items: [result("one"), result("two"), result("three")],
      pageCount: 2,
    });
  });

  it("fetches additional pages only when explicitly requested", async () => {
    const search = jest
      .fn<ReturnType<YouTubeApiAdapter["search"]>, Parameters<YouTubeApiAdapter["search"]>>()
      .mockResolvedValueOnce({
        items: [result("one"), result("two")],
        nextPageToken: "NEXT",
      })
      .mockResolvedValueOnce({
        items: [result("two"), result("three")],
      });
    const adapter = createAdapter(search);
    const queryClient = createTestQueryClient();
    const options = createDiscoverySearchQueryOptions({
      adapter,
      query: "  lo-fi  ",
      locale: LOCALE,
    });
    const observer = new InfiniteQueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(() => undefined);

    try {
      await observer.refetch();
      expect(search).toHaveBeenCalledTimes(1);
      expect(search).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ query: "lo-fi", pageToken: undefined }),
      );
      expect(observer.getCurrentResult().hasNextPage).toBe(true);

      await observer.fetchNextPage();
      expect(search).toHaveBeenCalledTimes(2);
      expect(search).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ query: "lo-fi", pageToken: "NEXT" }),
      );
      expect(observer.getCurrentResult().data).toEqual({
        items: [result("one"), result("two"), result("three")],
        pageCount: 2,
      });
      expect(observer.getCurrentResult().hasNextPage).toBe(false);
    } finally {
      unsubscribe();
      queryClient.clear();
    }
  });

  it("reuses fresh results from the session-only query cache", async () => {
    const search = jest.fn(async () => ({ items: [result("one")] }));
    const adapter = createAdapter(search);
    const queryClient = createTestQueryClient();
    const options = createDiscoverySearchQueryOptions({
      adapter,
      query: "lo-fi",
      locale: LOCALE,
    });

    await queryClient.fetchInfiniteQuery(options);
    await queryClient.fetchInfiniteQuery(options);

    expect(search).toHaveBeenCalledTimes(1);
    expect(options.staleTime).toBe(DISCOVERY_CACHE_TIME_MS);
    expect(options.gcTime).toBe(DISCOVERY_CACHE_TIME_MS);
    queryClient.clear();
  });

  it("forwards TanStack cancellation to the API adapter", async () => {
    let receivedSignal: AbortSignal | undefined;
    const search = jest.fn(
      ({ signal }: Parameters<YouTubeApiAdapter["search"]>[0]) =>
        new Promise<SearchPage>((_resolve, reject) => {
          receivedSignal = signal;
          signal?.addEventListener("abort", () => {
            reject(new YouTubeApiError("cancelled", { retryable: false }));
          });
        }),
    );
    const queryClient = createTestQueryClient();
    const options = createDiscoverySearchQueryOptions({
      adapter: createAdapter(search),
      query: "lo-fi",
      locale: LOCALE,
    });

    const pending = queryClient.fetchInfiniteQuery(options);
    await Promise.resolve();
    await queryClient.cancelQueries({ queryKey: options.queryKey });

    expect(receivedSignal?.aborted).toBe(true);
    await expect(pending).rejects.toThrow("CancelledError");
    queryClient.clear();
  });

  it("retries only the first retryable failure", () => {
    const retryable = new YouTubeApiError("offline", { retryable: true });
    const permanent = new YouTubeApiError("quota_exceeded", {
      retryable: false,
    });

    expect(shouldRetryDiscoverySearch(0, retryable)).toBe(true);
    expect(shouldRetryDiscoverySearch(1, retryable)).toBe(false);
    expect(shouldRetryDiscoverySearch(0, permanent)).toBe(false);
    expect(shouldRetryDiscoverySearch(0, new Error("unexpected"))).toBe(false);
  });

  it("disables invalid and explicitly inactive searches", () => {
    const adapter = createAdapter(jest.fn());

    expect(
      createDiscoverySearchQueryOptions({
        adapter,
        query: "x",
        locale: LOCALE,
      }).enabled,
    ).toBe(false);
    expect(
      createDiscoverySearchQueryOptions({
        adapter,
        query: "valid",
        locale: LOCALE,
        enabled: false,
      }).enabled,
    ).toBe(false);
  });
});
