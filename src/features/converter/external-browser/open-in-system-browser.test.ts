import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { openInSystemBrowser } from "./open-in-system-browser";

jest.mock("expo-linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserResultType: {
    OPENED: "opened",
  },
}));

const mockOpenUrl = Linking.openURL as jest.MockedFunction<
  typeof Linking.openURL
>;
const mockOpenBrowser =
  WebBrowser.openBrowserAsync as jest.MockedFunction<
    typeof WebBrowser.openBrowserAsync
  >;

describe("openInSystemBrowser", () => {
  beforeEach(() => {
    mockOpenUrl.mockReset();
    mockOpenBrowser.mockReset();
  });

  it("opens the requested URL in an attached Android Custom Tab", async () => {
    mockOpenBrowser.mockResolvedValue({
      type: WebBrowser.WebBrowserResultType.OPENED,
    });

    await expect(
      openInSystemBrowser("https://www.willowindfarm.ca/"),
    ).resolves.toBe(true);
    expect(mockOpenBrowser).toHaveBeenCalledWith(
      "https://www.willowindfarm.ca/",
      {
        createTask: false,
        enableBarCollapsing: true,
        enableDefaultShareMenuItem: false,
        showTitle: true,
      },
    );
    expect(mockOpenUrl).not.toHaveBeenCalled();
  });

  it("falls back to Android linking when Custom Tabs fail", async () => {
    mockOpenBrowser.mockRejectedValue(new Error("No Custom Tabs browser"));
    mockOpenUrl.mockResolvedValue(true);

    await expect(
      openInSystemBrowser("https://example.com/file"),
    ).resolves.toBe(true);
    expect(mockOpenUrl).toHaveBeenCalledWith(
      "https://example.com/file",
    );
  });

  it("reports failure when neither browser path can open the URL", async () => {
    mockOpenBrowser.mockRejectedValue(new Error("No Custom Tabs browser"));
    mockOpenUrl.mockRejectedValue(new Error("No handler"));

    await expect(
      openInSystemBrowser("https://example.com/file"),
    ).resolves.toBe(false);
  });
});
