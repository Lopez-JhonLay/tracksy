import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  Surface,
  ThemedButton,
  ThemedScreen,
  ThemedText,
  ThemeProvider,
  useTheme,
  type ThemeName,
} from "./src/theme";

function ThemePanel({ themeName }: { themeName: ThemeName }) {
  return (
    <ThemeProvider themeName={themeName}>
      <ThemePanelContent />
    </ThemeProvider>
  );
}

function ThemePanelContent() {
  const theme = useTheme();

  return (
    <Surface
      accessibilityLabel={theme.name + " theme preview"}
      raised
      style={{ gap: theme.spacing.md }}
    >
      <View style={styles.panelHeader}>
        <ThemedText variant="heading">
          {theme.name === "light" ? "Light" : "Dark"}
        </ThemedText>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.accentContainer,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
            },
          ]}
        >
          <ThemedText
            style={{ color: theme.colors.onAccent }}
            variant="caption"
          >
            Preview
          </ThemedText>
        </View>
      </View>

      <ThemedText tone="muted" variant="bodySmall">
        Indigo actions, lime accents, and accessible semantic color.
      </ThemedText>

      <View
        style={{
          gap: theme.spacing.sm,
          marginTop: theme.spacing.xxs,
        }}
      >
        <ThemedButton
          label="Use Link"
          onPress={() => undefined}
        />
        <ThemedButton
          label="Open in browser"
          onPress={() => undefined}
          variant="secondary"
        />
      </View>
    </Surface>
  );
}

function DesignSystemPreview() {
  const theme = useTheme();

  return (
    <ThemedScreen>
      <StatusBar
        style={theme.name === "dark" ? "light" : "dark"}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.layout.sectionGap,
            maxWidth: theme.layout.maxContentWidth,
            padding: theme.layout.screenPadding,
            paddingTop: theme.layout.topBarHeight,
          },
        ]}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="title">Tracksy</ThemedText>
          <ThemedText tone="muted">
            Design system foundation
          </ThemedText>
        </View>

        <ThemePanel themeName="light" />
        <ThemePanel themeName="dark" />
      </ScrollView>
    </ThemedScreen>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DesignSystemPreview />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    width: "100%",
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
