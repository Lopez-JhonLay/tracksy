import { z } from "zod";

export type YouTubeApiErrorCode =
  | "offline"
  | "invalid_key"
  | "quota_exceeded"
  | "service_unavailable"
  | "cancelled"
  | "unknown";

export type YouTubeApiErrorOptions = {
  status?: number;
  retryable: boolean;
};

export class YouTubeApiError extends Error {
  readonly code: YouTubeApiErrorCode;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(code: YouTubeApiErrorCode, options: YouTubeApiErrorOptions) {
    super(`YouTube request failed: ${code}`);
    this.name = "YouTubeApiError";
    this.code = code;
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

const ERROR_RESPONSE_SCHEMA = z.object({
  error: z.object({
    errors: z
      .array(z.object({ reason: z.string().optional() }))
      .optional(),
    details: z
      .array(z.object({ reason: z.string().optional() }))
      .optional(),
    status: z.string().optional(),
  }),
});

const QUOTA_REASONS = new Set([
  "dailylimitexceeded",
  "dailylimitexceededunreg",
  "limitexceeded",
  "quotaexceeded",
  "ratelimitexceeded",
  "servinglimitexceeded",
  "userratelimitexceeded",
]);

const INVALID_KEY_REASONS = new Set([
  "accessnotconfigured",
  "api_key_invalid",
  "apikeyinvalid",
  "forbidden",
  "keyinvalid",
]);

function getErrorReasons(body: unknown): string[] {
  const parsed = ERROR_RESPONSE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return [];
  }

  const { details = [], errors = [], status } = parsed.data.error;
  return [
    ...errors.map(({ reason }) => reason),
    ...details.map(({ reason }) => reason),
    status,
  ]
    .filter((reason): reason is string => typeof reason === "string")
    .map((reason) => reason.toLowerCase());
}

export function createHttpYouTubeApiError(
  status: number,
  body: unknown,
): YouTubeApiError {
  if (status >= 500) {
    return new YouTubeApiError("service_unavailable", {
      status,
      retryable: true,
    });
  }

  const reasons = getErrorReasons(body);

  if (status === 429 || reasons.some((reason) => QUOTA_REASONS.has(reason))) {
    return new YouTubeApiError("quota_exceeded", {
      status,
      retryable: false,
    });
  }

  if (
    status === 401 ||
    (status === 403 && reasons.length === 0) ||
    reasons.some((reason) => INVALID_KEY_REASONS.has(reason))
  ) {
    return new YouTubeApiError("invalid_key", {
      status,
      retryable: false,
    });
  }

  return new YouTubeApiError("unknown", {
    status,
    retryable: status === 408,
  });
}

export function createTransportYouTubeApiError(
  error: unknown,
  signal?: AbortSignal,
): YouTubeApiError {
  const errorName =
    typeof error === "object" && error !== null && "name" in error
      ? error.name
      : undefined;

  if (signal?.aborted || errorName === "AbortError") {
    return new YouTubeApiError("cancelled", { retryable: false });
  }

  if (error instanceof TypeError) {
    return new YouTubeApiError("offline", { retryable: true });
  }

  return new YouTubeApiError("unknown", { retryable: true });
}

export function isYouTubeApiError(error: unknown): error is YouTubeApiError {
  return error instanceof YouTubeApiError;
}
