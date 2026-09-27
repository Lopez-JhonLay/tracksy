export const MINIMUM_SEARCH_QUERY_LENGTH = 2;

export type SearchQueryValidation =
  | { status: "valid"; query: string }
  | { status: "invalid"; reason: "missing" | "too_short" };

export function validateSearchQuery(
  value: string | null | undefined,
): SearchQueryValidation {
  if (value === null || value === undefined) {
    return { status: "invalid", reason: "missing" };
  }

  const query = value.trim();

  if (Array.from(query).length < MINIMUM_SEARCH_QUERY_LENGTH) {
    return { status: "invalid", reason: "too_short" };
  }

  return { status: "valid", query };
}
