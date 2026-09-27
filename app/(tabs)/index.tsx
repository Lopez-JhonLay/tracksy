import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Surface,
  ThemedScreen,
  ThemedText,
  useTheme,
} from "../../src/theme";

export default function DiscoverScreen() {
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
            <ThemedText variant="title">Discover</ThemedText>
            <ThemedText tone="muted">
              Find a YouTube video and send its link to the converter.
            </ThemedText>
          </View>

          <Surface style={{ gap: theme.spacing.xs }}>
            <ThemedText variant="heading">
              Search is coming next
            </ThemedText>
            <ThemedText tone="muted" variant="bodySmall">
              This tab is ready for the YouTube discovery flow.
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
