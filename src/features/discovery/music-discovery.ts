export const MUSIC_DISCOVERY_QUERIES = [
  "new music",
  "OPM music",
  "chill music",
  "acoustic music",
  "indie music",
  "pop music",
  "R&B music",
  "live music performance",
] as const;

export function pickRandomMusicQuery(random = Math.random): string {
  const index = Math.min(
    Math.floor(random() * MUSIC_DISCOVERY_QUERIES.length),
    MUSIC_DISCOVERY_QUERIES.length - 1,
  );

  return MUSIC_DISCOVERY_QUERIES[Math.max(0, index)];
}
