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
      "https://junkyardpizzeria.ca/",
      "https://junkyardpizzeria.ca/",
    ],
    [
      "converter path",
      "https://junkyardpizzeria.ca/convert?source=tracksy#url",
      "https://junkyardpizzeria.ca/convert?source=tracksy#url",
    ],
    [
      "explicit default HTTPS port",
      "https://junkyardpizzeria.ca:443/convert",
      "https://junkyardpizzeria.ca/convert",
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
      "https://junkyardpizzeria.ca.evil.example/",
      "junkyardpizzeria.ca.evil.example",
      "https://junkyardpizzeria.ca.evil.example/",
    ],
    [
      "non-default port",
      "https://junkyardpizzeria.ca:444/convert",
      "junkyardpizzeria.ca",
      "https://junkyardpizzeria.ca:444/convert",
    ],
    [
      "userinfo lookalike",
      "https://junkyardpizzeria.ca@evil.example/",
      "evil.example",
      "https://junkyardpizzeria.ca@evil.example/",
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
    "http://junkyardpizzeria.ca/",
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
    "https://junkyardpizzeria.ca/",
    "https://example.com/",
    "javascript:alert(1)",
  ])("blocks popup request %s without opening it", (url) => {
    expect(decide(url, "popup")).toEqual({
      action: "block",
      reason: "popup",
    });
  });
});
