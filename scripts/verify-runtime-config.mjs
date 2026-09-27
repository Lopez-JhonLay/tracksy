import assert from "node:assert/strict";

import { resolveSearchLocale } from "../src/config/locale.ts";
import {
  ANDROID_PACKAGE_NAME,
  parseRuntimeConfig,
} from "../src/config/runtime-config.ts";

const ready = parseRuntimeConfig({
  youtubeApiKey: "test-restricted-key",
  androidCertSha1: "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd",
  searchFallbackRegion: "us",
  searchFallbackLanguage: "FIL",
});

assert.equal(ready.status, "ready");
if (ready.status === "ready") {
  assert.equal(ready.config.androidPackageName, ANDROID_PACKAGE_NAME);
  assert.equal(
    ready.config.androidCertSha1,
    "AABBCCDDEEFF00112233445566778899AABBCCDD",
  );
  assert.deepEqual(ready.config.searchFallback, {
    regionCode: "US",
    relevanceLanguage: "fil",
  });
}

const missing = parseRuntimeConfig({});
assert.deepEqual(missing, {
  status: "invalid",
  invalidFields: ["youtubeApiKey", "androidCertSha1"],
});
assert.equal(JSON.stringify(missing).includes("test-restricted-key"), false);

const invalidFallbacks = parseRuntimeConfig({
  youtubeApiKey: "test-restricted-key",
  androidCertSha1: "aabbccddeeff00112233445566778899aabbccdd",
  searchFallbackRegion: "invalid",
  searchFallbackLanguage: "1",
});
assert.equal(invalidFallbacks.status, "ready");
if (invalidFallbacks.status === "ready") {
  assert.deepEqual(invalidFallbacks.config.searchFallback, {
    regionCode: "PH",
    relevanceLanguage: "en",
  });
}

assert.deepEqual(
  resolveSearchLocale({
    languageCode: "FIL",
    languageTag: "fil-PH",
    regionCode: "ph",
  }),
  { regionCode: "PH", relevanceLanguage: "fil" },
);

assert.deepEqual(
  resolveSearchLocale({
    languageCode: null,
    languageTag: "es-MX",
    regionCode: "invalid",
  }),
  { regionCode: "PH", relevanceLanguage: "es" },
);

assert.deepEqual(
  resolveSearchLocale(
    { languageCode: "1", regionCode: "CA" },
    { regionCode: "US", relevanceLanguage: "fr" },
  ),
  { regionCode: "CA", relevanceLanguage: "fr" },
);

console.log("Runtime configuration and locale fallback verified.");
