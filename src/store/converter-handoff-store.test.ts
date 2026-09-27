import type { SearchResult } from "@/features/discovery";

import { createConverterHandoffStore } from "./converter-handoff-store";

const RESULT: SearchResult = {
  videoId: "abcdefghijk",
  title: "Test video",
  channelTitle: "Test channel",
  thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
  canonicalUrl: "https://www.youtube.com/watch?v=abcdefghijk",
};

describe("converter handoff store", () => {
  it("starts without persisted handoff state", () => {
    const firstStore = createConverterHandoffStore();
    firstStore.getState().sendToConverter(RESULT);

    const freshStore = createConverterHandoffStore();

    expect(firstStore.getState().handoff).toBeDefined();
    expect(freshStore.getState().handoff).toBeUndefined();
  });

  it("creates and returns a session handoff", () => {
    const store = createConverterHandoffStore({ now: () => 1_700_000_000_000 });

    const handoff = store.getState().sendToConverter(RESULT);

    expect(handoff).toEqual({
      requestId: "1700000000000-1",
      youtubeUrl: RESULT.canonicalUrl,
      selectedAt: 1_700_000_000_000,
    });
    expect(store.getState().handoff).toBe(handoff);
  });

  it("creates unique requests for repeated selections in the same millisecond", () => {
    const store = createConverterHandoffStore({ now: () => 42 });

    const first = store.getState().sendToConverter(RESULT);
    const second = store.getState().sendToConverter(RESULT);

    expect(first.requestId).toBe("42-1");
    expect(second.requestId).toBe("42-2");
    expect(second.requestId).not.toBe(first.requestId);
    expect(store.getState().handoff).toBe(second);
  });

  it("keeps request IDs increasing if the device clock moves backward", () => {
    const now = jest.fn().mockReturnValueOnce(100).mockReturnValueOnce(99);
    const store = createConverterHandoffStore({ now });

    const first = store.getState().sendToConverter(RESULT);
    const second = store.getState().sendToConverter(RESULT);

    expect(first.requestId).toBe("100-1");
    expect(second.requestId).toBe("100-2");
    expect(second.selectedAt).toBe(99);
  });

  it("clears only the matching active request", () => {
    const store = createConverterHandoffStore({ now: () => 42 });
    const handoff = store.getState().sendToConverter(RESULT);

    store.getState().clearHandoff(handoff.requestId);

    expect(store.getState().handoff).toBeUndefined();
  });

  it("ignores stale clear requests after a replacement selection", () => {
    const store = createConverterHandoffStore({ now: () => 42 });
    const first = store.getState().sendToConverter(RESULT);
    const replacement = store.getState().sendToConverter({
      ...RESULT,
      videoId: "lmnopqrstuv",
      canonicalUrl: "https://www.youtube.com/watch?v=lmnopqrstuv",
    });
    const stateBeforeStaleClear = store.getState();

    store.getState().clearHandoff(first.requestId);

    expect(store.getState()).toBe(stateBeforeStaleClear);
    expect(store.getState().handoff).toBe(replacement);
  });
});
