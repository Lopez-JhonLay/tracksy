import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { WebViewProps } from "react-native-webview";

import { useConverterHandoffStore } from "@/store";
import {
  ThemedButton,
  ThemedScreen,
  ThemedText,
  useTheme,
} from "@/theme";

import {
  openInSystemBrowser,
  type OpenInSystemBrowser,
} from "../external-browser";
import { CONVERTER_ORIGIN } from "../injection";
import type { ConverterNavigationDecision } from "../navigation";
import { ConverterWebView } from "./ConverterWebView";

const CONVERTER_URL = `${CONVERTER_ORIGIN}/`;

type ExternalNavigationDecision = Extract<
  ConverterNavigationDecision,
  { action: "confirm_external" }
>;

export type DownloadScreenProps = {
  converterSource?: WebViewProps["source"];
  openBrowser?: OpenInSystemBrowser;
};

export function DownloadScreen({
  converterSource,
  openBrowser = openInSystemBrowser,
}: DownloadScreenProps) {
  const theme = useTheme();
  const handoff = useConverterHandoffStore(
    (state) => state.handoff,
  );
  const clearHandoff = useConverterHandoffStore(
    (state) => state.clearHandoff,
  );
  const handleOpenBrowser = useCallback(
    async (url: string) => {
      const opened = await openBrowser(url);

      if (!opened) {
        Alert.alert(
          "Unable to open browser",
          "No browser could open this page. Reload the converter and try again.",
        );
      }
    },
    [openBrowser],
  );
  const handleOpenConverter = useCallback(() => {
    return handleOpenBrowser(CONVERTER_URL);
  }, [handleOpenBrowser]);
  const handleExternalNavigation = useCallback(
    (decision: ExternalNavigationDecision) => {
      Alert.alert(
        "Open external website?",
        `The converter wants to open ${decision.hostname} in your browser.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open",
            onPress: () => {
              void handleOpenBrowser(decision.url);
            },
          },
        ],
      );
    },
    [handleOpenBrowser],
  );

  return (
    <ThemedScreen>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View
          style={[
            styles.content,
            { maxWidth: theme.layout.maxContentWidth },
          ]}
        >
          <View
            style={[
              styles.toolbar,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
                paddingHorizontal: theme.layout.screenPadding,
              },
            ]}
          >
            <ThemedText accessibilityRole="header" variant="heading">
              Download
            </ThemedText>
            <ThemedButton
              label="Open in browser"
              onPress={handleOpenConverter}
              variant="tertiary"
            />
          </View>
          <View
            accessibilityLabel="Converter content"
            style={[
              styles.converter,
              { borderColor: theme.colors.border },
            ]}
          >
            <ConverterWebView
              handoff={handoff}
              onExternalNavigationRequest={handleExternalNavigation}
              onFilled={clearHandoff}
              source={converterSource}
            />
          </View>
        </View>
      </SafeAreaView>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    flex: 1,
    width: "100%",
  },
  converter: {
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  toolbar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
  },
});
