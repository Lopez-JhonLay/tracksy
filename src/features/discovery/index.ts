export type { SearchPage, SearchResult } from "./contracts";
export { parseIso8601Duration } from "./duration";
export { decodeHtmlEntities } from "./html-entities";
export {
  resolveSearchLocale,
  type DeviceLocale,
  type SearchLocale,
} from "./locale";
export {
  MINIMUM_SEARCH_QUERY_LENGTH,
  validateSearchQuery,
  type SearchQueryValidation,
} from "./query";
export {
  createCanonicalYouTubeUrl,
  isYouTubeVideoId,
} from "./youtube-url";
