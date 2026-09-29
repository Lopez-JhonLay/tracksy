import type { SearchResult } from "@/features/discovery";

import { copyAndOpenVideo } from "./copy-and-open-video";

const RESULT: SearchResult = {
  videoId: "abcdefghijk",
  title: "Test video",
  channelTitle: "Test channel",
  thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
  canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
};

describe("copyAndOpenVideo", () => {
  it("copies the canonical URL before opening the converter", async () => {
    const events: string[] = [];
    const outcome = await copyAndOpenVideo(RESULT, {
      copyToClipboard: jest.fn(async (value: string) => {
        events.push(`copy:${value}`);
        return true;
      }),
      openConverter: jest.fn(async () => {
        events.push("open");
        return true;
      }),
    });

    expect(outcome).toEqual({
      clipboardStatus: "copied",
      converterOpenStatus: "opened",
      youtubeUrl: RESULT.canonicalUrl,
    });
    expect(events).toEqual([`copy:${RESULT.canonicalUrl}`, "open"]);
  });

  it.each([
    ["rejection", jest.fn(async () => Promise.reject(new Error("denied")))],
    ["false result", jest.fn(async () => false)],
  ])("opens the converter after clipboard %s", async (_case, copyToClipboard) => {
    const openConverter = jest.fn(async () => true);
    const outcome = await copyAndOpenVideo(RESULT, {
      copyToClipboard,
      openConverter,
    });

    expect(outcome.clipboardStatus).toBe("unavailable");
    expect(openConverter).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["rejection", jest.fn(async () => Promise.reject(new Error("blocked")))],
    ["false result", jest.fn(async () => false)],
  ])("reports converter opening %s", async (_case, openConverter) => {
    const outcome = await copyAndOpenVideo(RESULT, {
      copyToClipboard: jest.fn(async () => true),
      openConverter,
    });

    expect(outcome.converterOpenStatus).toBe("unavailable");
    expect(outcome.youtubeUrl).toBe(RESULT.canonicalUrl);
  });
});
