import type {
  SearchPage,
  SearchResult,
} from "../contracts";
import type {
  YouTubeApiAdapter,
  YouTubeSearchInput,
} from "../api";
import { YouTubeApiError } from "../api";

const FIXTURE_THUMBNAIL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYPj/HwADAgH/5ncLrgAAAABJRU5ErkJggg==";
const SECOND_PAGE_TOKEN = "tracksy-fixture-page-2";

export const FAKE_SEARCH_RESULTS: readonly SearchResult[] = [
  {
    videoId: "dQw4w9WgXcQ",
    title: "Tracksy Fixture One",
    channelTitle: "Tracksy Test Channel",
    thumbnailUrl: FIXTURE_THUMBNAIL,
    durationSeconds: 213,
    canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    videoId: "M7lc1UVf-VE",
    title: "Tracksy Fixture Two",
    channelTitle: "Tracksy Test Channel",
    thumbnailUrl: FIXTURE_THUMBNAIL,
    durationSeconds: 301,
    canonicalUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  },
  {
    videoId: "aqz-KE-bpKQ",
    title: "Tracksy Fixture Page Two",
    channelTitle: "Tracksy Test Channel",
    thumbnailUrl: FIXTURE_THUMBNAIL,
    durationSeconds: 596,
    canonicalUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  },
] as const;

function getFixturePage(input: YouTubeSearchInput): SearchPage {
  if (input.signal?.aborted) {
    throw new YouTubeApiError("cancelled", { retryable: false });
  }

  if (input.pageToken === SECOND_PAGE_TOKEN) {
    return { items: [FAKE_SEARCH_RESULTS[2]] };
  }

  return {
    items: FAKE_SEARCH_RESULTS.slice(0, 2),
    nextPageToken: SECOND_PAGE_TOKEN,
  };
}

export function createFakeYouTubeApiAdapter(): YouTubeApiAdapter {
  return {
    search: async (input) => getFixturePage(input),
  };
}
