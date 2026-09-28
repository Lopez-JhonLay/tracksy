import { useNetInfo } from "@react-native-community/netinfo";
import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import type { ForwardedRef, PropsWithChildren } from "react";
import type { WebViewProps } from "react-native-webview";

import { ThemeProvider } from "@/theme";

import type { ConverterInjection, InjectionResult } from "../injection";
import { ConverterWebView } from "./ConverterWebView";

let mockLatestProps: WebViewProps | undefined;
let mockMountCount = 0;
let mockUnmountCount = 0;
const mockInjectJavaScript = jest.fn();
const mockReload = jest.fn();
const mockUseNetInfo = useNetInfo as jest.MockedFunction<
  typeof useNetInfo
>;

jest.mock("react-native-webview", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const mockReactNative =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    WebView: mockReact.forwardRef(
      (
        props: WebViewProps,
        ref: ForwardedRef<{
          injectJavaScript(script: string): void;
          reload(): void;
        }>,
      ) => {
        mockLatestProps = props;
        mockReact.useImperativeHandle(
          ref,
          () => ({
            injectJavaScript: mockInjectJavaScript,
            reload: mockReload,
          }),
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
type WebViewErrorEvent = Parameters<
  NonNullable<WebViewProps["onError"]>
>[0];
type WebViewRenderGoneEvent = Parameters<
  NonNullable<WebViewProps["onRenderProcessGone"]>
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

function errorEvent(): WebViewErrorEvent {
  return {
    nativeEvent: {
      url: "https://www.willowindfarm.ca/",
    },
    preventDefault: jest.fn(),
  } as unknown as WebViewErrorEvent;
}

function renderGoneEvent(): WebViewRenderGoneEvent {
  return {
    nativeEvent: { didCrash: true },
  } as WebViewRenderGoneEvent;
}

async function finishTrustedLoad() {
  await act(async () => {
    currentProps().onLoadEnd?.(
      loadEndEvent("https://www.willowindfarm.ca/"),
    );
  });
}

describe("ConverterWebView", () => {
  beforeEach(() => {
    mockLatestProps = undefined;
    mockMountCount = 0;
    mockUnmountCount = 0;
    mockInjectJavaScript.mockReset();
    mockReload.mockReset();
    mockUseNetInfo.mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
    } as ReturnType<typeof useNetInfo>);
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
      downloadingMessage: "Downloading file...",
      domStorageEnabled: true,
      geolocationEnabled: false,
      incognito: true,
      javaScriptCanOpenWindowsAutomatically: false,
      javaScriptEnabled: true,
      lackPermissionToDownloadMessage:
        "Tracksy could not start this download. Use Open in browser instead.",
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

    await act(async () => {
      currentProps().onLoadEnd?.(loadEndEvent("https://example.com/"));
    });
    expect(mockInjectJavaScript).not.toHaveBeenCalled();

    await act(async () => {
      currentProps().onLoadEnd?.(
        loadEndEvent("https://www.willowindfarm.ca/"),
      );
    });
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

    await act(async () => {
      currentProps().onMessage?.(messageEvent(filled));
      currentProps().onMessage?.(messageEvent(filled));
    });

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

    await act(async () => {
      currentProps().onMessage?.(messageEvent(result));
    });

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

  it("shows native loading feedback until the converter finishes loading", async () => {
    const screen = await render(<ConverterWebView />, {
      wrapper: Wrapper,
    });

    expect(screen.getByLabelText("Loading converter")).toBeTruthy();

    await finishTrustedLoad();

    await waitFor(() =>
      expect(screen.queryByLabelText("Loading converter")).toBeNull(),
    );
  });

  it("does not cover same-session converter routes with a stuck loader", async () => {
    const screen = await render(<ConverterWebView />, {
      wrapper: Wrapper,
    });
    await finishTrustedLoad();

    await act(async () => {
      currentProps().onLoadStart?.({
        nativeEvent: {
          url: "https://www.willowindfarm.ca/settings/audio",
        },
      } as Parameters<NonNullable<WebViewProps["onLoadStart"]>>[0]);
    });

    expect(screen.queryByLabelText("Loading converter")).toBeNull();
  });

  it("shows offline recovery and reloads without discarding the session", async () => {
    mockUseNetInfo.mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
    } as ReturnType<typeof useNetInfo>);
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText("You're offline")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Reload" }),
    );

    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("shows page-error recovery and reloads the current WebView", async () => {
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });
    const event = errorEvent();

    await act(async () => {
      currentProps().onError?.(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Converter unavailable")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Reload" }),
    );
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("recovers a terminated renderer by recreating the WebView", async () => {
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });

    await act(async () => {
      currentProps().onRenderProcessGone?.(renderGoneEvent());
    });

    expect(screen.getByText("Converter stopped")).toBeTruthy();
    expect(mockMountCount).toBe(1);
    await fireEvent.press(
      screen.getByRole("button", { name: "Reload" }),
    );
    expect(mockMountCount).toBe(2);
    expect(mockUnmountCount).toBe(1);
    expect(mockReload).not.toHaveBeenCalled();
  });

  it("keeps manual paste available when the converter field is missing", async () => {
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });
    await finishTrustedLoad();

    await act(async () => {
      currentProps().onMessage?.(
        messageEvent({
          requestId: HANDOFF.requestId,
          status: "field_missing",
        }),
      );
    });

    expect(screen.getByText("Paste link manually")).toBeTruthy();
    expect(screen.getByText(/still in the clipboard/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Paste manually" }),
    );
    expect(screen.queryByText("Paste link manually")).toBeNull();
  });

  it("retries autofill after a script error", async () => {
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });
    await finishTrustedLoad();
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);

    await act(async () => {
      currentProps().onMessage?.(
        messageEvent({
          requestId: HANDOFF.requestId,
          status: "script_error",
        }),
      );
    });

    expect(screen.getByText("Autofill failed")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Retry autofill" }),
    );
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(2);
  });

  it("reloads after a wrong-origin injection result", async () => {
    const screen = await render(<ConverterWebView handoff={HANDOFF} />, {
      wrapper: Wrapper,
    });
    await finishTrustedLoad();

    await act(async () => {
      currentProps().onMessage?.(
        messageEvent({
          requestId: HANDOFF.requestId,
          status: "wrong_origin",
        }),
      );
    });

    expect(screen.getByText("Converter changed")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Reload" }),
    );
    expect(mockReload).toHaveBeenCalledTimes(1);
  });
});
