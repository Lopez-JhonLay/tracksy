import { openYouTubeVideo } from "./open-youtube";

describe("openYouTubeVideo", () => {
  it("opens the canonical HTTPS URL for Android app-or-browser routing", async () => {
    const openURL = jest.fn(async () => true as const);

    await expect(
      openYouTubeVideo("abcdefghijk", { openURL }),
    ).resolves.toEqual({
      status: "opened",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
    });
    expect(openURL).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abcdefghijk",
    );
  });

  it("rejects invalid IDs without opening an external application", async () => {
    const openURL = jest.fn(async () => true as const);

    await expect(openYouTubeVideo("invalid", { openURL })).resolves.toEqual({
      status: "invalid_video",
    });
    expect(openURL).not.toHaveBeenCalled();
  });

  it("returns an unavailable result when Android cannot open the URL", async () => {
    const openURL = jest.fn(async () => Promise.reject(new Error("blocked")));

    await expect(
      openYouTubeVideo("abcdefghijk", { openURL }),
    ).resolves.toEqual({ status: "unavailable" });
  });
});
