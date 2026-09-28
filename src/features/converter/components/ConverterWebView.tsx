import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import {
  WebView,
  type WebViewProps,
} from "react-native-webview";

import { CONVERTER_ORIGIN } from "../injection";
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
type ExternalNavigationDecision = Extract<
  ConverterNavigationDecision,
  { action: "confirm_external" }
>;

export type ConverterWebViewProps = {
  onExternalNavigationRequest?: (
    decision: ExternalNavigationDecision,
  ) => void;
  onPopupBlocked?: () => void;
  requestId?: string;
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
  onExternalNavigationRequest,
  onPopupBlocked,
  requestId,
}: ConverterWebViewProps) {
  const sessionKey = useConverterSessionKey(requestId);
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
