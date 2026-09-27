import { parseIso8601Duration } from "./duration";

describe("parseIso8601Duration", () => {
  it.each([
    ["PT0S", 0],
    ["PT45S", 45],
    ["PT4M13S", 253],
    ["PT1H2M3S", 3723],
    ["P1DT2H3M4S", 93784],
    ["P2W", 1209600],
    ["P0D", 0],
  ])("parses %s into seconds", (duration, expected) => {
    expect(parseIso8601Duration(duration)).toBe(expected);
  });

  it.each([undefined, null, "", "PT", "P1DT", "1H", "pt1m", "P1M"])(
    "returns undefined for invalid or missing value %p",
    (duration) => {
      expect(parseIso8601Duration(duration)).toBeUndefined();
    },
  );

  it("rejects durations larger than JavaScript safe integers", () => {
    expect(
      parseIso8601Duration("P999999999999999999999999999999D"),
    ).toBeUndefined();
  });
});
