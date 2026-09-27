import { validateSearchQuery } from "./query";

describe("validateSearchQuery", () => {
  it("trims and accepts queries with at least two characters", () => {
    expect(validateSearchQuery("  lo-fi beats  ")).toEqual({
      status: "valid",
      query: "lo-fi beats",
    });
    expect(validateSearchQuery("ab")).toEqual({
      status: "valid",
      query: "ab",
    });
  });

  it("counts Unicode code points rather than UTF-16 units", () => {
    expect(validateSearchQuery("🎵")).toEqual({
      status: "invalid",
      reason: "too_short",
    });
    expect(validateSearchQuery("🎵a")).toEqual({
      status: "valid",
      query: "🎵a",
    });
  });

  it("rejects missing and too-short queries", () => {
    expect(validateSearchQuery(undefined)).toEqual({
      status: "invalid",
      reason: "missing",
    });
    expect(validateSearchQuery(null)).toEqual({
      status: "invalid",
      reason: "missing",
    });
    expect(validateSearchQuery("  a  ")).toEqual({
      status: "invalid",
      reason: "too_short",
    });
    expect(validateSearchQuery("   ")).toEqual({
      status: "invalid",
      reason: "too_short",
    });
  });
});
