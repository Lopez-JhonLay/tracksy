import { resolveTestAdaptersEnabled } from "./test-adapters";

describe("resolveTestAdaptersEnabled", () => {
  it("accepts only the boolean build-time value", () => {
    expect(
      resolveTestAdaptersEnabled({ tracksyTestAdaptersEnabled: true }),
    ).toBe(true);
    expect(
      resolveTestAdaptersEnabled({ tracksyTestAdaptersEnabled: "true" }),
    ).toBe(false);
    expect(resolveTestAdaptersEnabled(undefined)).toBe(false);
  });
});
