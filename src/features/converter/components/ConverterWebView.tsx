import { useCallback, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import {
  WebView,
  type WebViewProps,
} from "react-native-webview";

import {
  buildConverterInjectionScript,
  CONVERTER_ORIGIN,
  isTrustedConverterOrigin,
  parseTrustedInjectionResult,
  type ConverterInjection,
  type InjectionResult,
} from "../injection";
import {
  decideConverterNavigation,
  type ConverterNavigationDecision,
} from "../navigation";

const INITIAL_SESSION_KEY = "converter-initial";
const CONVERTER_URL = `${CONVERTER_ORIGIN}/`;
const CONVERTER_SOURCE = { uri: CONVERTER_URL };
const HTTPS_ORIGIN_WHITELIST = ["https://*"];

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
type ExternalNavigationDecision = Extract<
  ConverterNavigationDecision,
  { action: "confirm_external" }
>;

export type ConverterWebViewProps = {
  handoff?: ConverterInjection;
  onExternalNavigationRequest?: (
    decision: ExternalNavigationDecision,
  ) => void;
  onFilled?: (requestId: string) => void;
  onInjectionResult?: (result: InjectionResult) => void;
  onPopupBlocked?: () => void;
};

function useConverterSessionKey(requestId?: string) {
  const [session, setSession] = useState(() => ({
    latestRequestId: requestId,
    sessionKey: requestId ?? INITIAL_SESSION_KEY,
  }));

  if (requestId && requestId !== session.latestRequestId) {
    setSession({
      latestRequestId: requestId,
      sessionKey: requestId,
    });
  }

  return session.sessionKey;
}

export function ConverterWebView({
  handoff,
  onExternalNavigationRequest,
  onFilled,
  onInjectionResult,
  onPopupBlocked,
}: ConverterWebViewProps) {
  const requestId = handoff?.requestId;
  const sessionKey = useConverterSessionKey(requestId);
  const webViewRef = useRef<WebView>(null);
  const completedRequestId = useRef<string | undefined>(undefined);
  const handleLoadEnd = useCallback(
    (event: WebViewLoadEndEvent) => {
      if (
        !handoff ||
        completedRequestId.current === handoff.requestId ||
        !isTrustedConverterOrigin(event.nativeEvent.url)
      ) {
        return;
      }

      webViewRef.current?.injectJavaScript(
        buildConverterInjectionScript(handoff),
      );
    },
    [handoff],
  );
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const result = parseTrustedInjectionResult(
        event.nativeEvent.data,
        event.nativeEvent.url,
      );

      if (
        !result ||
        !handoff ||
        result.requestId !== handoff.requestId ||
        completedRequestId.current === result.requestId
      ) {
        return;
      }

      if (result.status === "filled") {
        completedRequestId.current = result.requestId;
      }

      onInjectionResult?.(result);

      if (result.status === "filled") {
        onFilled?.(result.requestId);
      }
    },
    [handoff, onFilled, onInjectionResult],
  );
  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      const decision = decideConverterNavigation({
        kind: "main_frame",
        url: request.url,
      });

      if (decision.action === "confirm_external") {
        onExternalNavigationRequest?.(decision);
      }

      return decision.action === "allow";
    },
    [onExternalNavigationRequest],
  );
  const handleOpenWindow = useCallback(
    (event: WebViewOpenWindowEvent) => {
      const decision = decideConverterNavigation({
        kind: "popup",
        url: event.nativeEvent.targetUrl,
      });

      if (decision.action === "block") {
        onPopupBlocked?.();
      }
    },
    [onPopupBlocked],
  );

  return (
    <WebView
      key={sessionKey}
      ref={webViewRef}
      accessibilityLabel="Third-party converter"
      allowFileAccess={false}
      allowFileAccessFromFileURLs={false}
      allowUniversalAccessFromFileURLs={false}
      allowsProtectedMedia={false}
      cacheEnabled={false}
      domStorageEnabled
      geolocationEnabled={false}
      incognito
      javaScriptCanOpenWindowsAutomatically={false}
      javaScriptEnabled
      mediaPlaybackRequiresUserAction
      mixedContentMode="never"
      onLoadEnd={handleLoadEnd}
      onMessage={handleMessage}
      onOpenWindow={handleOpenWindow}
      onShouldStartLoadWithRequest={handleShouldStartLoad}
      originWhitelist={HTTPS_ORIGIN_WHITELIST}
      setSupportMultipleWindows={false}
      source={CONVERTER_SOURCE}
      style={styles.webView}
      thirdPartyCookiesEnabled={false}
      webviewDebuggingEnabled={__DEV__}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});
