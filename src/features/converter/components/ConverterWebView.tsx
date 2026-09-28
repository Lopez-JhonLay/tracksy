import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import {
  WebView,
  type WebViewProps,
} from "react-native-webview";

import {
  Surface,
  ThemedButton,
  ThemedText,
  useTheme,
} from "@/theme";
import { testAdaptersEnabled } from "@/config";

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
type WebViewErrorEvent = Parameters<
  NonNullable<WebViewProps["onError"]>
>[0];
type WebViewHttpErrorEvent = Parameters<
  NonNullable<WebViewProps["onHttpError"]>
>[0];
type WebViewRenderGoneEvent = Parameters<
  NonNullable<WebViewProps["onRenderProcessGone"]>
>[0];
type ExternalNavigationDecision = Extract<
  ConverterNavigationDecision,
  { action: "confirm_external" }
>;
type PageStatus =
  | "loading"
  | "ready"
  | "page_error"
  | "renderer_error";
type InjectionFailure = Exclude<InjectionResult["status"], "filled">;
type RecoveryStatus =
  | "offline"
  | "page_error"
  | "renderer_error"
  | InjectionFailure;

export type ConverterWebViewProps = {
  handoff?: ConverterInjection;
  onExternalNavigationRequest?: (
    decision: ExternalNavigationDecision,
  ) => void;
  onFilled?: (requestId: string) => void;
  onInjectionResult?: (result: InjectionResult) => void;
  onPopupBlocked?: () => void;
  source?: WebViewProps["source"];
};

type RecoveryOverlayProps = {
  onContinueManually(): void;
  onReload(): void;
  onRetryInjection(): void;
  status: RecoveryStatus;
};

const recoveryContent: Record<
  RecoveryStatus,
  { body: string; title: string }
> = {
  offline: {
    title: "You're offline",
    body: "Reconnect to the internet, then reload the converter.",
  },
  page_error: {
    title: "Converter unavailable",
    body: "The converter page could not load. Try loading it again.",
  },
  renderer_error: {
    title: "Converter stopped",
    body: "Android closed the converter process. Reload to restore it.",
  },
  wrong_origin: {
    title: "Converter changed",
    body: "Tracksy stopped autofill because the page origin was not trusted.",
  },
  field_missing: {
    title: "Paste link manually",
    body: "The converter field changed. Your selected link is still in the clipboard.",
  },
  script_error: {
    title: "Autofill failed",
    body: "Retry autofill, reload the page, or paste the clipboard link manually.",
  },
};

function RecoveryOverlay({
  onContinueManually,
  onReload,
  onRetryInjection,
  status,
}: RecoveryOverlayProps) {
  const theme = useTheme();
  const content = recoveryContent[status];
  const canContinueManually =
    status === "field_missing" || status === "script_error";

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.overlay,
        {
          backgroundColor: theme.colors.overlay,
          padding: theme.spacing.md,
        },
      ]}
    >
      <Surface
        raised
        style={[
          styles.recoveryCard,
          {
            gap: theme.spacing.sm,
            maxWidth: theme.layout.maxContentWidth,
          },
        ]}
      >
        <ThemedText variant="heading">{content.title}</ThemedText>
        <ThemedText tone="muted" variant="bodySmall">
          {content.body}
        </ThemedText>
        <View style={[styles.actions, { gap: theme.spacing.xs }]}>
          {status === "script_error" ? (
            <ThemedButton
              label="Retry autofill"
              onPress={onRetryInjection}
            />
          ) : null}
          {canContinueManually ? (
            <ThemedButton
              label="Paste manually"
              onPress={onContinueManually}
              variant={status === "script_error" ? "secondary" : "primary"}
            />
          ) : null}
          <ThemedButton
            label="Reload"
            onPress={onReload}
            variant={canContinueManually ? "tertiary" : "primary"}
          />
        </View>
      </Surface>
    </View>
  );
}

function LoadingOverlay() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Loading converter"
      accessibilityLiveRegion="polite"
      style={[
        styles.overlay,
        styles.loadingOverlay,
        {
          backgroundColor: theme.colors.surface,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <ThemedText tone="muted">Loading converter…</ThemedText>
    </View>
  );
}

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
  source = CONVERTER_SOURCE,
}: ConverterWebViewProps) {
  const network = useNetInfo();
  const requestId = handoff?.requestId;
  const sessionKey = useConverterSessionKey(requestId);
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [injectionFailure, setInjectionFailure] =
    useState<InjectionFailure>();
  const [recoveryGeneration, setRecoveryGeneration] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const currentUrl = useRef(CONVERTER_URL);
  const completedLoadSessionKey = useRef<string | undefined>(undefined);
  const completedRequestId = useRef<string | undefined>(undefined);
  const isOffline =
    network.isConnected === false ||
    network.isInternetReachable === false;
  const recoveryStatus: RecoveryStatus | undefined = isOffline
    ? "offline"
    : pageStatus === "page_error" || pageStatus === "renderer_error"
      ? pageStatus
      : injectionFailure;

  const injectActiveHandoff = useCallback(
    (url: string) => {
      if (
        !handoff ||
        completedRequestId.current === handoff.requestId ||
        !isTrustedConverterOrigin(url)
      ) {
        return;
      }

      webViewRef.current?.injectJavaScript(
        buildConverterInjectionScript(handoff),
      );
    },
    [handoff],
  );
  const handleLoadStart = useCallback(() => {
    setInjectionFailure(undefined);

    if (completedLoadSessionKey.current !== sessionKey) {
      setPageStatus("loading");
    }
  }, [sessionKey]);
  const handleLoadEnd = useCallback(
    (event: WebViewLoadEndEvent) => {
      if ("code" in event.nativeEvent) {
        return;
      }

      currentUrl.current = event.nativeEvent.url;
      completedLoadSessionKey.current = sessionKey;
      setPageStatus("ready");
      injectActiveHandoff(event.nativeEvent.url);
    },
    [injectActiveHandoff, sessionKey],
  );
  const handleLoadError = useCallback((event: WebViewErrorEvent) => {
    event.preventDefault();
    setPageStatus("page_error");
  }, []);
  const handleHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    event.preventDefault();
    setPageStatus("page_error");
  }, []);
  const handleRenderProcessGone = useCallback(
    (_event: WebViewRenderGoneEvent) => {
      setPageStatus("renderer_error");
    },
    [],
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
        setInjectionFailure(undefined);
      } else {
        setInjectionFailure(result.status);
      }

      onInjectionResult?.(result);

      if (result.status === "filled") {
        onFilled?.(result.requestId);
      }
    },
    [handoff, onFilled, onInjectionResult],
  );
  const handleReload = useCallback(() => {
    completedLoadSessionKey.current = undefined;
    setInjectionFailure(undefined);
    setPageStatus("loading");

    if (pageStatus === "renderer_error") {
      setRecoveryGeneration((generation) => generation + 1);
      return;
    }

    webViewRef.current?.reload();
  }, [pageStatus]);
  const handleRetryInjection = useCallback(() => {
    setInjectionFailure(undefined);
    injectActiveHandoff(currentUrl.current);
  }, [injectActiveHandoff]);
  const handleContinueManually = useCallback(() => {
    setInjectionFailure(undefined);
  }, []);
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
    <View style={styles.container}>
      <WebView
        key={`${sessionKey}:${recoveryGeneration}`}
        ref={webViewRef}
        accessibilityLabel="Third-party converter"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        allowsProtectedMedia={false}
        cacheEnabled={false}
        downloadingMessage="Downloading file..."
        domStorageEnabled
        geolocationEnabled={false}
        incognito
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled
        lackPermissionToDownloadMessage="Tracksy could not start this download. Use Open in browser instead."
        mediaPlaybackRequiresUserAction
        mixedContentMode="never"
        onError={handleLoadError}
        onHttpError={handleHttpError}
        onLoadEnd={handleLoadEnd}
        onLoadStart={handleLoadStart}
        onMessage={handleMessage}
        onOpenWindow={handleOpenWindow}
        onRenderProcessGone={handleRenderProcessGone}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        originWhitelist={HTTPS_ORIGIN_WHITELIST}
        setSupportMultipleWindows={false}
        source={source}
        style={styles.webView}
        thirdPartyCookiesEnabled={false}
        webviewDebuggingEnabled={__DEV__ || testAdaptersEnabled}
      />
      {recoveryStatus ? (
        <RecoveryOverlay
          onContinueManually={handleContinueManually}
          onReload={handleReload}
          onRetryInjection={handleRetryInjection}
          status={recoveryStatus}
        />
      ) : pageStatus === "loading" ? (
        <LoadingOverlay />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "stretch",
  },
  container: {
    flex: 1,
  },
  loadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  recoveryCard: {
    alignSelf: "center",
    width: "100%",
  },
  webView: {
    flex: 1,
  },
});
