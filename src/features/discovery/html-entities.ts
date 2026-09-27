const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00A0",
  quot: '"',
};

const ENTITY_PATTERN = /&(#(?:x[\dA-F]+|\d+)|[A-Z][\dA-Z]+);/gi;

function decodeNumericEntity(entity: string): string {
  const isHexadecimal = entity[1]?.toLowerCase() === "x";
  const digits = entity.slice(isHexadecimal ? 2 : 1);
  const codePoint = Number.parseInt(digits, isHexadecimal ? 16 : 10);

  if (
    !Number.isInteger(codePoint) ||
    codePoint <= 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return "\uFFFD";
  }

  return String.fromCodePoint(codePoint);
}

export function decodeHtmlEntities(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(ENTITY_PATTERN, (match, entity: string) => {
    if (entity.startsWith("#")) {
      return decodeNumericEntity(entity);
    }

    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}
