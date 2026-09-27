import type { YouTubeFetch } from "./youtube-api";
import { createYouTubeApiAdapter } from "./youtube-api";
import { isYouTubeApiError } from "./youtube-api-error";

const CLIENT_CONFIG = {
  youtubeApiKey: "test-restricted-key",
  androidPackageName: "com.jhonlaylopez.tracksy" as const,
  androidCertSha1: "AABBCCDDEEFF00112233445566778899AABBCCDD",
};

const SEARCH_INPUT = {
  query: "  lo-fi beats  ",
  locale: { regionCode: "PH", relevanceLanguage: "en" },
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn(async () => body),
  } as unknown as Response;
}

function createFetchMock() {
  return jest.fn(
    async (_input: string, _init: RequestInit): Promise<Response> =>
      jsonResponse({}),
  );
}

const FIRST_VIDEO_ID = "abcdefghijk";
const SECOND_VIDEO_ID = "lmnopqrstuv";

function searchItem(
  videoId: string,
  title: string,
  channelTitle: string,
  thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
) {
  return {
    id: { videoId },
    snippet: {
      title,
      channelTitle,
      thumbnails: { medium: { url: thumbnailUrl } },
    },
  };
}

describe("createYouTubeApiAdapter", () => {
  it("sends restricted requests and enriches results in search order", async () => {
    const fetchMock = createFetchMock()
      .mockResolvedValueOnce(
        jsonResponse({
          nextPageToken: "NEXT_PAGE",
          items: [
            searchItem(FIRST_VIDEO_ID, "One &amp; Only", "Channel &#39;A&#39;"),
            searchItem(SECOND_VIDEO_ID, "Second", "Channel B"),
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: SECOND_VIDEO_ID,
              contentDetails: { duration: "PT2M" },
            },
            {
              id: FIRST_VIDEO_ID,
              contentDetails: { duration: "PT45S" },
            },
          ],
        }),
      );
    const controller = new AbortController();
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    const page = await adapter.search({
      ...SEARCH_INPUT,
      pageToken: "PAGE_TOKEN",
      signal: controller.signal,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [searchRequest, searchInit] = fetchMock.mock.calls[0];
    const searchUrl = new URL(searchRequest);
    expect(searchUrl.origin).toBe("https://www.googleapis.com");
    expect(searchUrl.pathname).toBe("/youtube/v3/search");
    expect(Object.fromEntries(searchUrl.searchParams)).toMatchObject({
      part: "snippet",
      type: "video",
      maxResults: "20",
      safeSearch: "moderate",
      q: "lo-fi beats",
      regionCode: "PH",
      relevanceLanguage: "en",
      pageToken: "PAGE_TOKEN",
    });
    expect(searchUrl.searchParams.has("key")).toBe(false);
    expect(searchUrl.searchParams.get("fields")).toContain("id/videoId");
    expect(searchInit).toMatchObject({
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "x-goog-api-key": CLIENT_CONFIG.youtubeApiKey,
        "X-Android-Package": CLIENT_CONFIG.androidPackageName,
        "X-Android-Cert": CLIENT_CONFIG.androidCertSha1,
      },
    });

    const [videosRequest, videosInit] = fetchMock.mock.calls[1];
    const videosUrl = new URL(videosRequest);
    expect(videosUrl.pathname).toBe("/youtube/v3/videos");
    expect(videosUrl.searchParams.get("part")).toBe("contentDetails");
    expect(videosUrl.searchParams.get("id")).toBe(
      `${FIRST_VIDEO_ID},${SECOND_VIDEO_ID}`,
    );
    expect(videosUrl.searchParams.has("key")).toBe(false);
    expect(videosInit.signal).toBe(controller.signal);

    expect(page).toEqual({
      nextPageToken: "NEXT_PAGE",
      items: [
        {
          videoId: FIRST_VIDEO_ID,
          title: "One & Only",
          channelTitle: "Channel 'A'",
          thumbnailUrl: `https://i.ytimg.com/vi/${FIRST_VIDEO_ID}/mqdefault.jpg`,
          canonicalUrl: `https://www.youtube.com/watch?v=${FIRST_VIDEO_ID}`,
          durationSeconds: 45,
        },
        {
          videoId: SECOND_VIDEO_ID,
          title: "Second",
          channelTitle: "Channel B",
          thumbnailUrl: `https://i.ytimg.com/vi/${SECOND_VIDEO_ID}/mqdefault.jpg`,
          canonicalUrl: `https://www.youtube.com/watch?v=${SECOND_VIDEO_ID}`,
          durationSeconds: 120,
        },
      ],
    });
  });

  it("does not request durations for an empty result page", async () => {
    const fetchMock = createFetchMock().mockResolvedValueOnce(
      jsonResponse({ items: [], nextPageToken: "   " }),
    );
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    await expect(adapter.search(SEARCH_INPUT)).resolves.toEqual({ items: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips malformed results and keeps missing durations optional", async () => {
    const fetchMock = createFetchMock()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            searchItem("bad-id", "Bad", "Bad"),
            { id: { videoId: FIRST_VIDEO_ID } },
            searchItem(
              SECOND_VIDEO_ID,
              "Insecure thumbnail",
              "Channel",
              "http://example.com/image.jpg",
            ),
            searchItem(FIRST_VIDEO_ID, "Valid", "Channel"),
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: FIRST_VIDEO_ID,
              contentDetails: { duration: "invalid" },
            },
            { id: SECOND_VIDEO_ID },
          ],
        }),
      );
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    const page = await adapter.search(SEARCH_INPUT);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      videoId: FIRST_VIDEO_ID,
      title: "Valid",
    });
    expect(page.items[0]).not.toHaveProperty("durationSeconds");
  });

  it("rejects invalid queries without making a request", async () => {
    const fetchMock = createFetchMock();
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    await expect(
      adapter.search({ ...SEARCH_INPUT, query: "x" }),
    ).rejects.toMatchObject({ code: "unknown", retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cancels before the first request and between metadata requests", async () => {
    const initiallyCancelled = new AbortController();
    initiallyCancelled.abort();
    const unusedFetch = createFetchMock();
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: unusedFetch as YouTubeFetch,
    });

    await expect(
      adapter.search({ ...SEARCH_INPUT, signal: initiallyCancelled.signal }),
    ).rejects.toMatchObject({ code: "cancelled", retryable: false });
    expect(unusedFetch).not.toHaveBeenCalled();

    const controller = new AbortController();
    const firstResponse = jsonResponse({
      items: [searchItem(FIRST_VIDEO_ID, "Valid", "Channel")],
    });
    firstResponse.json = jest.fn(async () => {
      controller.abort();
      return {
        items: [searchItem(FIRST_VIDEO_ID, "Valid", "Channel")],
      };
    });
    const fetchMock = createFetchMock().mockResolvedValueOnce(firstResponse);
    const cancellingAdapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    await expect(
      cancellingAdapter.search({ ...SEARCH_INPUT, signal: controller.signal }),
    ).rejects.toMatchObject({ code: "cancelled" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      400,
      { error: { errors: [{ reason: "keyInvalid" }] } },
      "invalid_key",
      false,
    ],
    [
      403,
      { error: { errors: [{ reason: "quotaExceeded" }] } },
      "quota_exceeded",
      false,
    ],
    [429, { error: {} }, "quota_exceeded", false],
    [503, { error: {} }, "service_unavailable", true],
    [
      400,
      { error: { errors: [{ reason: "invalidPageToken" }] } },
      "unknown",
      false,
    ],
  ])(
    "maps HTTP %i responses to %s behavior",
    async (status, body, code, retryable) => {
      const fetchMock = createFetchMock().mockResolvedValueOnce(
        jsonResponse(body, status),
      );
      const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
        fetch: fetchMock as YouTubeFetch,
      });

      await expect(adapter.search(SEARCH_INPUT)).rejects.toMatchObject({
        code,
        status,
        retryable,
      });
    },
  );

  it("maps transport failures without retaining credential values", async () => {
    const fetchMock = createFetchMock().mockRejectedValueOnce(
      new TypeError("Network request failed"),
    );
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    try {
      await adapter.search(SEARCH_INPUT);
      throw new Error("Expected adapter search to fail");
    } catch (error) {
      expect(isYouTubeApiError(error)).toBe(true);
      expect(error).toMatchObject({ code: "offline", retryable: true });
      expect(String(error)).not.toContain(CLIENT_CONFIG.youtubeApiKey);
    }
  });

  it("maps aborted fetches to cancelled", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    const fetchMock = createFetchMock().mockRejectedValueOnce(abortError);
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    await expect(adapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: "cancelled",
      retryable: false,
    });
  });

  it("normalizes duration-request server failures", async () => {
    const fetchMock = createFetchMock()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [searchItem(FIRST_VIDEO_ID, "Valid", "Channel")],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: {} }, 500));
    const adapter = createYouTubeApiAdapter(CLIENT_CONFIG, {
      fetch: fetchMock as YouTubeFetch,
    });

    await expect(adapter.search(SEARCH_INPUT)).rejects.toMatchObject({
      code: "service_unavailable",
      status: 500,
      retryable: true,
    });
  });
});
