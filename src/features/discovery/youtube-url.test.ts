import {
  createCanonicalYouTubeUrl,
  isYouTubeVideoId,
} from "./youtube-url";

describe("YouTube URL utilities", () => {
  it("builds the documented canonical watch URL", () => {
    expect(createCanonicalYouTubeUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("trims an otherwise valid video ID", () => {
    expect(createCanonicalYouTubeUrl("  dQw4w9WgXcQ  ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("rejects missing, malformed, and unsafe IDs", () => {
    expect(isYouTubeVideoId("")).toBe(false);
    expect(createCanonicalYouTubeUrl("")).toBeUndefined();
    expect(createCanonicalYouTubeUrl("too-short")).toBeUndefined();
    expect(createCanonicalYouTubeUrl("abc&feature=share")).toBeUndefined();
  });
});
