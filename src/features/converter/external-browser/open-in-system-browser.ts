import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

export type OpenInSystemBrowser = (url: string) => Promise<boolean>;

export const openInSystemBrowser: OpenInSystemBrowser = async (url) => {
  try {
    await WebBrowser.openBrowserAsync(url, {
      createTask: false,
      enableBarCollapsing: true,
      enableDefaultShareMenuItem: false,
      showTitle: true,
    });
    return true;
  } catch {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
};
