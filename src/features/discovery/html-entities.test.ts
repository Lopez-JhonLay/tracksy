import { decodeHtmlEntities } from "./html-entities";

describe("decodeHtmlEntities", () => {
  it("decodes common named entities into plain text", () => {
    expect(
      decodeHtmlEntities("Rock &amp; Roll &quot;Live&quot; &lt;3"),
    ).toBe('Rock & Roll "Live" <3');
  });

  it("decodes decimal and hexadecimal Unicode entities", () => {
    expect(decodeHtmlEntities("Music &#9835; &#x1F3B5;")).toBe(
      "Music ♫ 🎵",
    );
  });

  it("preserves unknown entities and does not decode recursively", () => {
    expect(decodeHtmlEntities("&unknown; &amp;lt;b&amp;gt;")).toBe(
      "&unknown; &lt;b&gt;",
    );
  });

  it("returns safe fallbacks for missing and invalid numeric input", () => {
    expect(decodeHtmlEntities(undefined)).toBe("");
    expect(decodeHtmlEntities(null)).toBe("");
    expect(decodeHtmlEntities("&#0;")).toBe("�");
    expect(decodeHtmlEntities("&#xD800;")).toBe("�");
  });
});
