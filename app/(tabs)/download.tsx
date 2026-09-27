import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Surface,
  ThemedScreen,
  ThemedText,
  useTheme,
} from "../../src/theme";

export default function DownloadScreen() {
  const theme = useTheme();

  return (
    <ThemedScreen>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View
          style={[
            styles.content,
            {
              gap: theme.layout.sectionGap,
              maxWidth: theme.layout.maxContentWidth,
              padding: theme.layout.screenPadding,
            },
          ]}
        >
          <View style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="title">Download</ThemedText>
            <ThemedText tone="muted">
              The selected link will open here in the converter.
            </ThemedText>
          </View>

          <Surface style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="heading">
              No link selected
            </ThemedText>
            <ThemedText tone="muted" variant="bodySmall">
              Choose Use Link from Discover to begin.
            </ThemedText>
          </Surface>
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
  safeArea: {
    flex: 1,
  },
});
