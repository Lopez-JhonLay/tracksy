import { render } from "@testing-library/react-native";
import type { ForwardedRef, PropsWithChildren } from "react";
import type { WebViewProps } from "react-native-webview";

import type { ConverterInjection, InjectionResult } from "../injection";
import { ThemeProvider } from "@/theme";

import { ConverterWebView } from "./ConverterWebView";

let mockLatestProps: WebViewProps | undefined;
let mockMountCount = 0;
let mockUnmountCount = 0;
const mockInjectJavaScript = jest.fn();

jest.mock("react-native-webview", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    WebView: mockReact.forwardRef(
      (
        props: WebViewProps,
        ref: ForwardedRef<{ injectJavaScript(script: string): void }>,
      ) => {
    const mockReact = jest.requireActual<typeof import("react")>("react");
        mockLatestProps = props;
        mockReact.useImperativeHandle(
          ref,
          () => ({ injectJavaScript: mockInjectJavaScript }),
          [],
        );
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
    ),
  };
});

function Wrapper({ children }: PropsWithChildren) {
  return <ThemeProvider themeName="light">{children}</ThemeProvider>;
}

type ShouldStartLoadRequest = Parameters<
  NonNullable<WebViewProps["onShouldStartLoadWithRequest"]>
>[0];
type WebViewOpenWindowEvent = Parameters<
  NonNullable<WebViewProps["onOpenWindow"]>
>[0];
type WebViewLoadEndEvent = Parameters<
  NonNullable<WebViewProps["onLoadEnd"]>
>[0];
type WebViewMessageEvent = Parameters<
  NonNullable<WebViewProps["onMessage"]>
>[0];

const HANDOFF: ConverterInjection = {
  requestId: "42-1",
  youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
};

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

function loadEndEvent(url: string): WebViewLoadEndEvent {
  return {
    nativeEvent: { url },
  } as WebViewLoadEndEvent;
}

function messageEvent(
  result: InjectionResult,
  url = "https://www.willowindfarm.ca/",
): WebViewMessageEvent {
  return {
    nativeEvent: {
      data: JSON.stringify(result),
      url,
    },
  } as WebViewMessageEvent;
}

describe("ConverterWebView", () => {
  beforeEach(() => {
    mockLatestProps = undefined;
    mockMountCount = 0;
    mockUnmountCount = 0;
    mockInjectJavaScript.mockReset();
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
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });

    expect(mockMountCount).toBe(1);
    expect(mockUnmountCount).toBe(0);

    await screen.rerender(<ConverterWebView handoff={HANDOFF} />);
    expect(mockMountCount).toBe(1);
    expect(mockUnmountCount).toBe(0);

    await screen.rerender(
      <ConverterWebView
        handoff={{
          requestId: "43-1",
          youtubeUrl: HANDOFF.youtubeUrl,
        }}
      />,
    );
    expect(mockMountCount).toBe(2);
    expect(mockUnmountCount).toBe(1);

    await screen.rerender(<ConverterWebView />);
    expect(mockMountCount).toBe(2);
    expect(mockUnmountCount).toBe(1);
  });

  it("injects the active handoff only after the trusted origin loads", async () => {
    await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });

    currentProps().onLoadEnd?.(loadEndEvent("https://example.com/"));
    expect(mockInjectJavaScript).not.toHaveBeenCalled();

    currentProps().onLoadEnd?.(
      loadEndEvent("https://www.willowindfarm.ca/"),
    );
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining(JSON.stringify(HANDOFF.youtubeUrl)),
    );
  });

  it("clears only after a matching filled result and ignores duplicates", async () => {
    const onFilled = jest.fn();
    const onInjectionResult = jest.fn();
    await render(
      <ConverterWebView
        handoff={HANDOFF}
        onFilled={onFilled}
        onInjectionResult={onInjectionResult}
      />,
      { wrapper: Wrapper },
    );
    const filled: InjectionResult = {
      requestId: HANDOFF.requestId,
      status: "filled",
    };

    currentProps().onMessage?.(messageEvent(filled));
    currentProps().onMessage?.(messageEvent(filled));

    expect(onInjectionResult).toHaveBeenCalledTimes(1);
    expect(onInjectionResult).toHaveBeenCalledWith(filled);
    expect(onFilled).toHaveBeenCalledTimes(1);
    expect(onFilled).toHaveBeenCalledWith(HANDOFF.requestId);
  });

  it.each([
    "wrong_origin",
    "field_missing",
    "script_error",
  ] as const)("reports %s without clearing the handoff", async (status) => {
    const onFilled = jest.fn();
    const onInjectionResult = jest.fn();
    await render(
      <ConverterWebView
        handoff={HANDOFF}
        onFilled={onFilled}
        onInjectionResult={onInjectionResult}
      />,
      { wrapper: Wrapper },
    );
    const result: InjectionResult = {
      requestId: HANDOFF.requestId,
      status,
    };

    currentProps().onMessage?.(messageEvent(result));

    expect(onInjectionResult).toHaveBeenCalledWith(result);
    expect(onFilled).not.toHaveBeenCalled();
  });

  it("ignores stale, invalid, and untrusted messages", async () => {
    const onFilled = jest.fn();
    const onInjectionResult = jest.fn();
    await render(
      <ConverterWebView
        handoff={HANDOFF}
        onFilled={onFilled}
        onInjectionResult={onInjectionResult}
      />,
      { wrapper: Wrapper },
    );

    currentProps().onMessage?.(
      messageEvent({ requestId: "stale-1", status: "filled" }),
    );
    currentProps().onMessage?.(
      messageEvent(
        { requestId: HANDOFF.requestId, status: "filled" },
        "https://example.com/",
      ),
    );
    currentProps().onMessage?.({
      nativeEvent: {
        data: "not JSON",
        url: "https://www.willowindfarm.ca/",
      },
    } as WebViewMessageEvent);

    expect(onInjectionResult).not.toHaveBeenCalled();
    expect(onFilled).not.toHaveBeenCalled();
  });
});
