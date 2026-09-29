jest.mock("react-native-safe-area-context", () =>
  jest.requireActual<{ default: unknown }>(
    "react-native-safe-area-context/jest/mock",
  ).default,
);

jest.mock("expo-localization", () => ({
  getCalendars: jest.fn(() => []),
  getLocales: jest.fn(() => [
    {
      languageCode: "en",
      languageTag: "en-PH",
      regionCode: "PH",
      textDirection: "ltr",
    },
  ]),
  useCalendars: jest.fn(() => []),
  useLocales: jest.fn(() => [
    {
      languageCode: "en",
      languageTag: "en-PH",
      regionCode: "PH",
      textDirection: "ltr",
    },
  ]),
}));

jest.mock("expo-clipboard", () => ({
  getStringAsync: jest.fn(async () => ""),
  hasStringAsync: jest.fn(async () => false),
  setStringAsync: jest.fn(async () => true),
}));
