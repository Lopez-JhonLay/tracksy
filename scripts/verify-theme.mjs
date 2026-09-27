import assert from "node:assert/strict";

import { resolveThemeName } from "../src/theme/resolve-theme.ts";
import {
  darkColors,
  getThemeTokens,
  layout,
  lightColors,
  spacing,
  themes,
} from "../src/theme/tokens.ts";

const expectedColorTokens = [
  "accent",
  "accentContainer",
  "background",
  "border",
  "danger",
  "focus",
  "info",
  "onAccent",
  "onPrimary",
  "onPrimaryContainer",
  "overlay",
  "primary",
  "primaryContainer",
  "primaryPressed",
  "success",
  "surface",
  "surfaceMuted",
  "surfaceRaised",
  "text",
  "textMuted",
  "warning",
];

assert.deepEqual(Object.keys(lightColors).sort(), expectedColorTokens);
assert.deepEqual(Object.keys(darkColors).sort(), expectedColorTokens);
assert.equal(resolveThemeName("light"), "light");
assert.equal(resolveThemeName("dark"), "dark");
assert.equal(resolveThemeName("unspecified"), "light");
assert.equal(resolveThemeName(null), "light");
assert.equal(resolveThemeName(undefined), "light");
assert.equal(getThemeTokens("light"), themes.light);
assert.equal(getThemeTokens("dark"), themes.dark);
assert.equal(layout.minTouchTarget, 48);
assert.deepEqual(Object.values(spacing), [
  0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64,
]);

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return (
    0.2126 * channels[0] +
    0.7152 * channels[1] +
    0.0722 * channels[2]
  );
}

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

const contrastPairs = [
  ["light primary", lightColors.primary, lightColors.onPrimary],
  ["light body", lightColors.background, lightColors.text],
  ["light muted", lightColors.surface, lightColors.textMuted],
  ["light accent", lightColors.accent, lightColors.onAccent],
  [
    "light primary container",
    lightColors.primaryContainer,
    lightColors.onPrimaryContainer,
  ],
  ["dark primary", darkColors.primary, darkColors.onPrimary],
  ["dark body", darkColors.background, darkColors.text],
  ["dark muted", darkColors.surface, darkColors.textMuted],
  ["dark accent", darkColors.accent, darkColors.onAccent],
  [
    "dark primary container",
    darkColors.primaryContainer,
    darkColors.onPrimaryContainer,
  ],
];

for (const [name, background, foreground] of contrastPairs) {
  assert.ok(
    contrastRatio(background, foreground) >= 4.5,
    name + " must meet WCAG AA text contrast",
  );
}

console.log("Theme contract verified for light and dark modes.");
