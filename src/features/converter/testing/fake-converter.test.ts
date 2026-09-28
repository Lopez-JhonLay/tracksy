import { FAKE_CONVERTER_HTML, FAKE_CONVERTER_SOURCE } from "./fake-converter";

describe("fake converter page", () => {
  it("provides the production selector without automatic conversion", () => {
    expect(FAKE_CONVERTER_SOURCE.baseUrl).toBe(
      "https://www.willowindfarm.ca/",
    );
    expect(FAKE_CONVERTER_HTML).toContain('id="url"');
    expect(FAKE_CONVERTER_HTML).toContain('id="convert"');
    expect(FAKE_CONVERTER_HTML).not.toMatch(/\.click\s*\(/);
    expect(FAKE_CONVERTER_HTML).toContain(
      "Link ready; Convert was not pressed",
    );
  });
});
