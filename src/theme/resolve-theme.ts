import type { ThemeName } from "./tokens";

export type SystemColorScheme =
  | ThemeName
  | "unspecified"
  | null
  | undefined;

export function resolveThemeName(colorScheme: SystemColorScheme): ThemeName {
  return colorScheme === "dark" ? "dark" : "light";
}
