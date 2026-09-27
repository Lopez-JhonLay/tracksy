import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import { useColorScheme } from "react-native";

import { resolveThemeName } from "./resolve-theme";
import {
  getThemeTokens,
  type ThemeName,
  type ThemeTokens,
} from "./tokens";

const ThemeContext = createContext<ThemeTokens | null>(null);

export type ThemeProviderProps = PropsWithChildren<{
  themeName?: ThemeName;
}>;

export function ThemeProvider({
  children,
  themeName,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const resolvedThemeName =
    themeName ?? resolveThemeName(systemColorScheme);
  const theme = getThemeTokens(resolvedThemeName);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeTokens {
  const theme = useContext(ThemeContext);

  if (theme === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return theme;
}
