import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConverterWebView } from "@/features/converter/components";
import { useConverterHandoffStore } from "@/store";
import {
  ThemedScreen,
  ThemedText,
  useTheme,
} from "@/theme";

export default function DownloadScreen() {
  const theme = useTheme();
  const handoff = useConverterHandoffStore(
    (state) => state.handoff,
  );
  const clearHandoff = useConverterHandoffStore(
    (state) => state.clearHandoff,
  );

  return (
    <ThemedScreen>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View
          style={[
            styles.content,
            {
              maxWidth: theme.layout.maxContentWidth,
            },
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
          </View>
          <View
            accessibilityLabel="Converter content"
            style={[
              styles.converter,
              {
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ConverterWebView
              handoff={handoff}
              onFilled={clearHandoff}
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
  },
});
