import * as Linking from "expo-linking";

import { createCanonicalYouTubeUrl } from "../youtube-url";

export type ExternalUrlOpener = Pick<typeof Linking, "openURL">;

export type OpenYouTubeResult =
  | { status: "opened"; url: string }
  | { status: "invalid_video" | "unavailable" };

export type OpenYouTubeVideo = (
  videoId: string,
) => Promise<OpenYouTubeResult>;

export async function openYouTubeVideo(
  videoId: string,
  opener: ExternalUrlOpener = Linking,
): Promise<OpenYouTubeResult> {
  const url = createCanonicalYouTubeUrl(videoId);

  if (!url) {
    return { status: "invalid_video" };
  }

  try {
    await opener.openURL(url);
    return { status: "opened", url };
  } catch {
    return { status: "unavailable" };
  }
}
