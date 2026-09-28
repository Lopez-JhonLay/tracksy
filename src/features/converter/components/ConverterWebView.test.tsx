import { render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import type { WebViewProps } from "react-native-webview";

import { ThemeProvider } from "@/theme";

import { ConverterWebView } from "./ConverterWebView";

let mockLatestProps: WebViewProps | undefined;
let mockMountCount = 0;
let mockUnmountCount = 0;

jest.mock("react-native-webview", () => ({
  WebView: (props: WebViewProps) => {
    const mockReact = jest.requireActual<typeof import("react")>("react");
    const mockReactNative =
      jest.requireActual<typeof import("react-native")>("react-native");
    mockLatestProps = props;

    mockReact.useEffect(() => {
      mockMountCount += 1;
      return () => {
        mockUnmountCount += 1;
      };
    }, []);

    return mockReact.createElement(mockReactNative.View, {
      testID: "converter-webview",
    });
  },
}));

function Wrapper({ children }: PropsWithChildren) {
  return <ThemeProvider themeName="light">{children}</ThemeProvider>;
}

type ShouldStartLoadRequest = Parameters<
  NonNullable<WebViewProps["onShouldStartLoadWithRequest"]>
>[0];
type WebViewOpenWindowEvent = Parameters<
  NonNullable<WebViewProps["onOpenWindow"]>
>[0];

function request(url: string): ShouldStartLoadRequest {
  return {
    canGoBack: false,
    canGoForward: false,
    isTopFrame: true,
    loading: true,
    lockIdentifier: 1,
    navigationType: "other",
    title: "",
    url,
  };
}

function currentProps(): WebViewProps {
  if (!mockLatestProps) {
    throw new Error("Expected the mocked WebView to render.");
  }

  return mockLatestProps;
}

describe("ConverterWebView", () => {
  beforeEach(() => {
    mockLatestProps = undefined;
    mockMountCount = 0;
    mockUnmountCount = 0;
  });

  it("loads the converter with the required secure Android settings", async () => {
    await render(<ConverterWebView />, { wrapper: Wrapper });

    expect(currentProps()).toMatchObject({
      accessibilityLabel: "Third-party converter",
      allowFileAccess: false,
      allowFileAccessFromFileURLs: false,
      allowUniversalAccessFromFileURLs: false,
      allowsProtectedMedia: false,
      cacheEnabled: false,
      domStorageEnabled: true,
      geolocationEnabled: false,
      incognito: true,
      javaScriptCanOpenWindowsAutomatically: false,
      javaScriptEnabled: true,
      mediaPlaybackRequiresUserAction: true,
      mixedContentMode: "never",
      originWhitelist: ["https://*"],
      setSupportMultipleWindows: false,
      source: { uri: "https://www.willowindfarm.ca/" },
      thirdPartyCookiesEnabled: false,
      webviewDebuggingEnabled: true,
    });
  });

  it("allows only trusted navigation and reports external HTTPS", async () => {
    const onExternalNavigationRequest = jest.fn();
    await render(
      <ConverterWebView
        onExternalNavigationRequest={onExternalNavigationRequest}
      />,
      { wrapper: Wrapper },
    );
    const shouldStart = currentProps().onShouldStartLoadWithRequest;

    expect(
      shouldStart?.(request("https://www.willowindfarm.ca/convert")),
    ).toBe(true);
    expect(shouldStart?.(request("http://www.willowindfarm.ca/"))).toBe(false);
    expect(shouldStart?.(request("javascript:alert(1)"))).toBe(false);
    expect(shouldStart?.(request("https://example.com/download"))).toBe(false);
    expect(onExternalNavigationRequest).toHaveBeenCalledWith({
      action: "confirm_external",
      hostname: "example.com",
      url: "https://example.com/download",
    });
  });

  it("reports and does not open popup requests", async () => {
    const onPopupBlocked = jest.fn();
    await render(<ConverterWebView onPopupBlocked={onPopupBlocked} />, {
      wrapper: Wrapper,
    });

    currentProps().onOpenWindow?.({
      nativeEvent: {
        targetUrl: "https://www.willowindfarm.ca/popup",
      },
    } as WebViewOpenWindowEvent);

    expect(onPopupBlocked).toHaveBeenCalledTimes(1);
  });

  it("remounts for a replacement request but preserves the session after clearing", async () => {
    const screen = await render(<ConverterWebView requestId="42-1" />, {
      wrapper: Wrapper,
    });

    expect(mockMountCount).toBe(1);
    expect(mockUnmountCount).toBe(0);

    await screen.rerender(<ConverterWebView requestId="42-1" />);
    expect(mockMountCount).toBe(1);
    expect(mockUnmountCount).toBe(0);

    await screen.rerender(<ConverterWebView requestId="43-1" />);
    expect(mockMountCount).toBe(2);
    expect(mockUnmountCount).toBe(1);

    await screen.rerender(<ConverterWebView />);
    expect(mockMountCount).toBe(2);
    expect(mockUnmountCount).toBe(1);
  });
});
