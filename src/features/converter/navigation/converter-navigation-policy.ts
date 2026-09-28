import { CONVERTER_ORIGIN } from "../injection";

export type ConverterNavigationRequest = {
  kind: "main_frame" | "popup";
  url: string;
};

export type ConverterNavigationDecision =
  | {
      action: "allow";
      url: string;
    }
  | {
      action: "confirm_external";
      hostname: string;
      url: string;
    }
  | {
      action: "block";
      reason: "popup" | "invalid_url" | "http" | "unsafe_scheme";
    };

export function decideConverterNavigation({
  kind,
  url,
}: ConverterNavigationRequest): ConverterNavigationDecision {
  if (kind === "popup") {
    return { action: "block", reason: "popup" };
  }

  let destination: URL;
  try {
    destination = new URL(url);
  } catch {
    return { action: "block", reason: "invalid_url" };
  }

  if (destination.protocol === "http:") {
    return { action: "block", reason: "http" };
  }

  if (destination.protocol !== "https:") {
    return { action: "block", reason: "unsafe_scheme" };
  }

  if (destination.origin === CONVERTER_ORIGIN) {
    return { action: "allow", url: destination.href };
  }

  return {
    action: "confirm_external",
    hostname: destination.hostname,
    url: destination.href,
  };
}
