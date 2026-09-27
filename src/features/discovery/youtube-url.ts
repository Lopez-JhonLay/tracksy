const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeVideoId(value: string): boolean {
  return YOUTUBE_VIDEO_ID_PATTERN.test(value);
}

export function createCanonicalYouTubeUrl(videoId: string): string | undefined {
  const normalizedVideoId = videoId.trim();

  if (!isYouTubeVideoId(normalizedVideoId)) {
    return undefined;
  }

  return `https://www.youtube.com/watch?v=${normalizedVideoId}`;
}
