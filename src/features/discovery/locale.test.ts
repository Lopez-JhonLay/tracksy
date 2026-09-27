import { resolveSearchLocale } from "./locale";

describe("resolveSearchLocale", () => {
  it("normalizes the device region and primary language", () => {
    expect(
      resolveSearchLocale({
        languageCode: "FIL",
        languageTag: "fil-PH",
        regionCode: "ph",
      }),
    ).toEqual({ regionCode: "PH", relevanceLanguage: "fil" });
  });

  it("derives the primary language from the language tag", () => {
    expect(
      resolveSearchLocale({
        languageCode: null,
        languageTag: "es-MX",
        regionCode: "mx",
      }),
    ).toEqual({ regionCode: "MX", relevanceLanguage: "es" });
  });

  it("falls back independently for invalid or missing values", () => {
    expect(
      resolveSearchLocale({
        languageCode: "1",
        languageTag: null,
        regionCode: "ca",
      }),
    ).toEqual({ regionCode: "CA", relevanceLanguage: "en" });

    expect(
      resolveSearchLocale(
        { languageCode: "fr", regionCode: "invalid" },
        { regionCode: "US", relevanceLanguage: "de" },
      ),
    ).toEqual({ regionCode: "US", relevanceLanguage: "fr" });

    expect(resolveSearchLocale(undefined)).toEqual({
      regionCode: "PH",
      relevanceLanguage: "en",
    });
  });
});
