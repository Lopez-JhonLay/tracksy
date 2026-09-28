import { YouTubeApiError } from "../api";
import {
  createFakeYouTubeApiAdapter,
  FAKE_SEARCH_RESULTS,
} from "./fake-youtube-api";

const LOCALE = { regionCode: "PH", relevanceLanguage: "en" };

describe("fake YouTube API adapter", () => {
  it("returns deterministic pages without using the network", async () => {
    const adapter = createFakeYouTubeApiAdapter();
    const firstPage = await adapter.search({
      query: "fixture",
      locale: LOCALE,
    });
    const secondPage = await adapter.search({
      query: "fixture",
      locale: LOCALE,
      pageToken: firstPage.nextPageToken,
    });

    expect(firstPage).toEqual({
      items: FAKE_SEARCH_RESULTS.slice(0, 2),
      nextPageToken: "tracksy-fixture-page-2",
    });
    expect(secondPage).toEqual({ items: [FAKE_SEARCH_RESULTS[2]] });
  });

  it("honors cancellation", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      createFakeYouTubeApiAdapter().search({
        query: "fixture",
        locale: LOCALE,
        signal: controller.signal,
      }),
    ).rejects.toEqual(expect.any(YouTubeApiError));
  });
});
