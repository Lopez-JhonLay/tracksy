import type { SearchResult } from "@/features/discovery";
import { createConverterHandoffStore } from "@/store";

import { sendVideoToConverter } from "./send-video-to-converter";

const RESULT: SearchResult = {
  videoId: "abcdefghijk",
  title: "Test video",
  channelTitle: "Test channel",
  thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
  canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
};

describe("sendVideoToConverter", () => {
  it("creates the handoff, copies its URL, then navigates", async () => {
    const events: string[] = [];
    const store = createConverterHandoffStore({ now: () => 42 });
    const sendToConverter = jest.fn((result: SearchResult) => {
      events.push("handoff");
      return store.getState().sendToConverter(result);
    });
    const copyToClipboard = jest.fn(async (value: string) => {
      events.push(`copy:${value}`);
      return true;
    });
    const navigateToDownload = jest.fn(() => {
      events.push("navigate");
    });

    const outcome = await sendVideoToConverter(RESULT, {
      copyToClipboard,
      navigateToDownload,
      sendToConverter,
    });

    expect(outcome).toEqual({
      handoff: {
        requestId: "42-1",
        youtubeUrl: RESULT.canonicalUrl,
        selectedAt: 42,
      },
      clipboardStatus: "copied",
    });
    expect(events).toEqual([
      "handoff",
      `copy:${RESULT.canonicalUrl}`,
      "navigate",
    ]);
    expect(store.getState().handoff).toBe(outcome.handoff);
  });

  it.each([
    ["rejection", jest.fn(async () => Promise.reject(new Error("denied")))],
    ["false result", jest.fn(async () => false)],
  ])(
    "keeps the handoff and navigates after clipboard %s",
    async (_case, copyToClipboard) => {
      const store = createConverterHandoffStore({ now: () => 42 });
      const navigateToDownload = jest.fn();

      const outcome = await sendVideoToConverter(RESULT, {
        copyToClipboard,
        navigateToDownload,
        sendToConverter: store.getState().sendToConverter,
      });

      expect(outcome.clipboardStatus).toBe("unavailable");
      expect(outcome.handoff).toBe(store.getState().handoff);
      expect(navigateToDownload).toHaveBeenCalledTimes(1);
    },
  );
});
