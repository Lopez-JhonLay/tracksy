import { act, render, waitFor } from "@testing-library/react-native";
import { Alert, type GestureResponderEvent } from "react-native";

import {
  ThemeProvider,
  type ThemedButtonProps,
} from "@/theme";

import type { ConverterWebViewProps } from "./ConverterWebView";
import { DownloadScreen } from "./DownloadScreen";

let mockConverterProps: ConverterWebViewProps | undefined;
let mockBrowserButtonProps: ThemedButtonProps | undefined;

jest.mock("./ConverterWebView", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    ConverterWebView: (props: ConverterWebViewProps) => {
      mockConverterProps = props;
      return mockReact.createElement(mockReactNative.View, {
        testID: "converter-webview",
      });
    },
  };
});

jest.mock("@/theme", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative =
    jest.requireActual<typeof import("react-native")>("react-native");
  const mockActualTheme = jest.requireActual<typeof import("@/theme")>(
    "@/theme",
  );

  return {
    ...mockActualTheme,
    ThemedButton: (props: ThemedButtonProps) => {
      mockBrowserButtonProps = props;
      return mockReact.createElement(mockReactNative.Pressable, {
        accessibilityLabel: props.label,
        accessibilityRole: "button",
        onPress: props.onPress,
      });
    },
  };
});

async function pressBrowserButton() {
  if (!mockBrowserButtonProps?.onPress) {
    throw new Error("Expected the browser button to render.");
  }

  await mockBrowserButtonProps.onPress({} as GestureResponderEvent);
}

async function renderScreen(
  openBrowser = jest.fn().mockResolvedValue(true),
) {
  return {
    openBrowser,
    screen: await render(
      <ThemeProvider themeName="light">
        <DownloadScreen openBrowser={openBrowser} />
      </ThemeProvider>,
    ),
  };
}

describe("DownloadScreen browser fallback", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockConverterProps = undefined;
    mockBrowserButtonProps = undefined;
  });

  it("always offers the trusted converter in the system browser", async () => {
    const { openBrowser, screen } = await renderScreen();

    expect(
      screen.getByRole("button", { name: "Open in browser" }),
    ).toBeTruthy();
    await pressBrowserButton();

    await waitFor(() =>
      expect(openBrowser).toHaveBeenCalledWith(
        "https://www.willowindfarm.ca/",
      ),
    );
  });

  it("requires confirmation before opening an external HTTPS redirect", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation();
    const { openBrowser } = await renderScreen();

    await act(async () => {
      mockConverterProps?.onExternalNavigationRequest?.({
        action: "confirm_external",
        hostname: "downloads.example.com",
        url: "https://downloads.example.com/file",
      });
    });

    expect(openBrowser).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      "Open external website?",
      "The converter wants to open downloads.example.com in your browser.",
      expect.any(Array),
    );
    expect(alert.mock.calls[0]?.[2]).toEqual([
      { text: "Cancel", style: "cancel" },
      expect.objectContaining({ text: "Open" }),
    ]);
  });

  it("reports when Android cannot open the browser fallback", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation();
    await renderScreen(jest.fn().mockResolvedValue(false));

    await pressBrowserButton();

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Unable to open browser",
        "No browser could open this page. Reload the converter and try again.",
      ),
    );
  });
});
