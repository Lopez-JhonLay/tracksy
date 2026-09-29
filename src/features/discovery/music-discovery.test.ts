import {
  MUSIC_DISCOVERY_QUERIES,
  pickRandomMusicQuery,
} from "./music-discovery";

describe("pickRandomMusicQuery", () => {
  it("selects a deterministic query from the discovery pool", () => {
    expect(pickRandomMusicQuery(() => 0)).toBe(MUSIC_DISCOVERY_QUERIES[0]);
    expect(pickRandomMusicQuery(() => 0.999)).toBe(
      MUSIC_DISCOVERY_QUERIES.at(-1),
    );
  });

  it("keeps unexpected random values within the discovery pool", () => {
    expect(MUSIC_DISCOVERY_QUERIES).toContain(
      pickRandomMusicQuery(() => 1),
    );
    expect(MUSIC_DISCOVERY_QUERIES).toContain(
      pickRandomMusicQuery(() => -1),
    );
  });
});
