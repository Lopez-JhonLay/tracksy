export type ThemeName = "light" | "dark";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  accent: string;
  accentContainer: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  focus: string;
  overlay: string;
};

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  control: 48,
  section: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700" },
  title: { fontSize: 24, lineHeight: 32, fontWeight: "700" },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
} as const;

export const iconSize = {
  sm: 18,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const motion = {
  fast: 120,
  standard: 200,
  slow: 300,
} as const;

export const elevation = {
  flat: 0,
  low: 1,
  raised: 3,
} as const;

export const layout = {
  screenPadding: 16,
  sectionGap: 24,
  maxContentWidth: 720,
  topBarHeight: 56,
  tabBarHeight: 64,
  searchFieldHeight: 52,
  minTouchTarget: 48,
  resultThumbnailWidth: 120,
  resultThumbnailHeight: 68,
} as const;

export type ThemeTokens = {
  name: ThemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  iconSize: typeof iconSize;
  motion: typeof motion;
  elevation: typeof elevation;
  layout: typeof layout;
};

export const lightColors = {
  background: "#F8F9FC",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceMuted: "#F0F1F7",
  text: "#171824",
  textMuted: "#5F6473",
  border: "#D9DCE7",
  primary: "#4F46E5",
  primaryPressed: "#4338CA",
  onPrimary: "#FFFFFF",
  primaryContainer: "#E5E7FF",
  onPrimaryContainer: "#312E81",
  accent: "#A3E635",
  accentContainer: "#EFFFC9",
  onAccent: "#1A2E05",
  success: "#247A3D",
  warning: "#9A5700",
  danger: "#B42318",
  info: "#2458C6",
  focus: "#4F46E5",
  overlay: "rgba(14, 15, 23, 0.48)",
} as const satisfies ColorTokens;

export const darkColors = {
  background: "#0E0F17",
  surface: "#171925",
  surfaceRaised: "#202333",
  surfaceMuted: "#282B3B",
  text: "#F5F6FA",
  textMuted: "#AEB3C2",
  border: "#34384A",
  primary: "#A7A2FF",
  primaryPressed: "#8D86F2",
  onPrimary: "#17132E",
  primaryContainer: "#302B66",
  onPrimaryContainer: "#E7E5FF",
  accent: "#B8F34A",
  accentContainer: "#29370A",
  onAccent: "#172006",
  success: "#6CE59A",
  warning: "#F6C177",
  danger: "#FF8A80",
  info: "#82B1FF",
  focus: "#B8F34A",
  overlay: "rgba(0, 0, 0, 0.64)",
} as const satisfies ColorTokens;

const sharedTokens = {
  spacing,
  radius,
  typography,
  iconSize,
  motion,
  elevation,
  layout,
} as const;

export const themes = {
  light: {
    name: "light",
    colors: lightColors,
    ...sharedTokens,
  },
  dark: {
    name: "dark",
    colors: darkColors,
    ...sharedTokens,
  },
} as const satisfies Record<ThemeName, ThemeTokens>;

export function getThemeTokens(themeName: ThemeName): ThemeTokens {
  return themes[themeName];
}
