import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "./ThemeProvider";
import type { ThemeTokens } from "./tokens";

export type TextVariant = keyof ThemeTokens["typography"];
export type TextTone =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

const textToneKeys = {
  default: "text",
  muted: "textMuted",
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
} as const satisfies Record<TextTone, keyof ThemeTokens["colors"]>;

export function ThemedText({
  variant = "body",
  tone = "default",
  style,
  ...props
}: ThemedTextProps) {
  const theme = useTheme();
  const textStyle = theme.typography[variant];

  return (
    <Text
      {...props}
      style={[
        textStyle,
        { color: theme.colors[textToneKeys[tone]] },
        style,
      ]}
    />
  );
}

export type ThemedScreenProps = ViewProps;

export function ThemedScreen({
  style,
  ...props
}: ThemedScreenProps) {
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    />
  );
}

export type SurfaceProps = ViewProps & {
  children?: ReactNode;
  raised?: boolean;
  padded?: boolean;
};

export function Surface({
  raised = false,
  padded = true,
  style,
  ...props
}: SurfaceProps) {
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: raised
            ? theme.colors.surfaceRaised
            : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          elevation: raised ? theme.elevation.raised : theme.elevation.flat,
          padding: padded ? theme.spacing.md : theme.spacing.none,
        },
        style,
      ]}
    />
  );
}

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "destructive";

export type ThemedButtonProps = Omit<
  PressableProps,
  "children" | "style"
> & {
  label: string;
  leadingIcon?: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

type ButtonColors = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

function getButtonColors(
  theme: ThemeTokens,
  variant: ButtonVariant,
  pressed: boolean,
  disabled: boolean,
): ButtonColors {
  if (disabled) {
    return {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.border,
      textColor: theme.colors.textMuted,
    };
  }

  if (variant === "primary") {
    return {
      backgroundColor: pressed
        ? theme.colors.primaryPressed
        : theme.colors.primary,
      borderColor: pressed
        ? theme.colors.primaryPressed
        : theme.colors.primary,
      textColor: theme.colors.onPrimary,
    };
  }

  if (variant === "destructive") {
    return {
      backgroundColor: pressed
        ? theme.colors.surfaceMuted
        : "transparent",
      borderColor: theme.colors.danger,
      textColor: theme.colors.danger,
    };
  }

  if (variant === "secondary") {
    return {
      backgroundColor: pressed
        ? theme.colors.primaryContainer
        : theme.colors.surface,
      borderColor: theme.colors.primary,
      textColor: theme.colors.primary,
    };
  }

  return {
    backgroundColor: pressed
      ? theme.colors.primaryContainer
      : "transparent",
    borderColor: "transparent",
    textColor: theme.colors.primary,
  };
}

export function ThemedButton({
  label,
  leadingIcon,
  variant = "primary",
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
  onFocus,
  onBlur,
  ...props
}: ThemedButtonProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      style={({ pressed }) => {
        const colors = getButtonColors(
          theme,
          variant,
          pressed,
          isDisabled,
        );

        return [
          styles.button,
          {
            backgroundColor: colors.backgroundColor,
            borderColor: focused
              ? theme.colors.focus
              : colors.borderColor,
            borderRadius: theme.radius.md,
            minHeight: theme.layout.minTouchTarget,
            paddingHorizontal: theme.spacing.md,
          },
          focused && styles.focusedButton,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const colors = getButtonColors(
          theme,
          variant,
          pressed,
          isDisabled,
        );

        return (
          <View
            style={[
              styles.buttonContent,
              { gap: leadingIcon ? theme.spacing.xs : theme.spacing.none },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                accessibilityElementsHidden
                color={colors.textColor}
                size="small"
                style={styles.loadingIndicator}
              />
            ) : null}
            {leadingIcon ? (
              <View style={{ opacity: loading ? 0 : 1 }}>
                {leadingIcon}
              </View>
            ) : null}
            <Text
              style={[
                theme.typography.label as TextStyle,
                {
                  color: colors.textColor,
                  opacity: loading ? 0 : 1,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  button: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  focusedButton: {
    borderWidth: 2,
  },
  loadingIndicator: {
    position: "absolute",
  },
});
