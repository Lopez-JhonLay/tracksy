import {
  decideConverterNavigation,
  type ConverterNavigationRequest,
} from "./converter-navigation-policy";

function decide(
  url: string,
  kind: ConverterNavigationRequest["kind"] = "main_frame",
) {
  return decideConverterNavigation({ kind, url });
}

describe("converter navigation policy", () => {
  it.each([
    [
      "converter home",
      "https://www.willowindfarm.ca/",
      "https://www.willowindfarm.ca/",
    ],
    [
      "converter path",
      "https://www.willowindfarm.ca/convert?source=tracksy#url",
      "https://www.willowindfarm.ca/convert?source=tracksy#url",
    ],
    [
      "explicit default HTTPS port",
      "https://www.willowindfarm.ca:443/convert",
      "https://www.willowindfarm.ca/convert",
    ],
  ])("allows the trusted origin for %s", (_case, url, normalizedUrl) => {
    expect(decide(url)).toEqual({
      action: "allow",
      url: normalizedUrl,
    });
  });

  it.each([
    [
      "different hostname",
      "https://example.com/download?id=1",
      "example.com",
      "https://example.com/download?id=1",
    ],
    [
      "lookalike hostname",
      "https://www.willowindfarm.ca.evil.example/",
      "www.willowindfarm.ca.evil.example",
      "https://www.willowindfarm.ca.evil.example/",
    ],
    [
      "non-default port",
      "https://www.willowindfarm.ca:444/convert",
      "www.willowindfarm.ca",
      "https://www.willowindfarm.ca:444/convert",
    ],
    [
      "userinfo lookalike",
      "https://www.willowindfarm.ca@evil.example/",
      "evil.example",
      "https://www.willowindfarm.ca@evil.example/",
    ],
  ])(
    "requires confirmation for external HTTPS with a %s",
    (_case, url, hostname, normalizedUrl) => {
      expect(decide(url)).toEqual({
        action: "confirm_external",
        hostname,
        url: normalizedUrl,
      });
    },
  );

  it.each([
    "http://www.willowindfarm.ca/",
    "http://example.com/",
  ])("blocks HTTP navigation to %s", (url) => {
    expect(decide(url)).toEqual({
      action: "block",
      reason: "http",
    });
  });

  it.each([
    "file:///data/user/0/tracksy/private",
    "content://com.example.provider/item",
    "data:text/html,<script>alert(1)</script>",
    "javascript:alert(1)",
    "intent://converter#Intent;scheme=https;end",
    "market://details?id=com.example",
    "mailto:test@example.com",
    "tracksy://converter",
  ])("blocks unsafe or unsupported scheme %s", (url) => {
    expect(decide(url)).toEqual({
      action: "block",
      reason: "unsafe_scheme",
    });
  });

  it.each(["", "not a url", "://missing-scheme"])(
    "blocks invalid destination %s",
    (url) => {
      expect(decide(url)).toEqual({
        action: "block",
        reason: "invalid_url",
      });
    },
  );

  it.each([
    "https://www.willowindfarm.ca/",
    "https://example.com/",
    "javascript:alert(1)",
  ])("blocks popup request %s without opening it", (url) => {
    expect(decide(url, "popup")).toEqual({
      action: "block",
      reason: "popup",
    });
  });
});
