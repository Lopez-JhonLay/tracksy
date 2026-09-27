import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import {
  StyleSheet,
  View,
  type ColorValue,
} from "react-native";

import { useTheme } from "../../src/theme";

type TabBarIconProps = {
  color: ColorValue;
  focused: boolean;
  name: "compass-outline" | "download-outline";
  size: number;
};

function TabBarIcon({
  color,
  focused,
  name,
  size,
}: TabBarIconProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.iconContainer,
        { gap: theme.spacing.xxs },
      ]}
    >
      <MaterialCommunityIcons
        color={color}
        name={name}
        size={size}
      />
      <View
        style={{
          backgroundColor: focused
            ? theme.colors.accent
            : "transparent",
          borderRadius: theme.radius.pill,
          height: theme.spacing.xxs,
          width: theme.iconSize.lg,
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        freezeOnBlur: false,
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarItemStyle: {
          minHeight: theme.layout.minTouchTarget,
          paddingTop: theme.spacing.xxs,
        },
        tabBarLabelStyle: theme.typography.label,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          minHeight: theme.layout.tabBarHeight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Discover tab",
          tabBarButtonTestID: "discover-tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name="compass-outline"
              size={size}
            />
          ),
          title: "Discover",
        }}
      />
      <Tabs.Screen
        name="download"
        options={{
          tabBarAccessibilityLabel: "Download tab",
          tabBarButtonTestID: "download-tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabBarIcon
              color={color}
              focused={focused}
              name="download-outline"
              size={size}
            />
          ),
          title: "Download",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
