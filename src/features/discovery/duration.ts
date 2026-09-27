const WEEK_DURATION_PATTERN = /^P(\d+)W$/;
const DATE_TIME_DURATION_PATTERN =
  /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

function toSafeSeconds(parts: readonly number[]): number | undefined {
  const seconds = parts.reduce((total, part) => total + part, 0);
  return Number.isSafeInteger(seconds) ? seconds : undefined;
}

export function parseIso8601Duration(
  value: string | null | undefined,
): number | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const weekMatch = WEEK_DURATION_PATTERN.exec(value);
  if (weekMatch) {
    return toSafeSeconds([Number(weekMatch[1]) * 7 * 24 * 60 * 60]);
  }

  const match = DATE_TIME_DURATION_PATTERN.exec(value);
  if (!match) {
    return undefined;
  }

  const [, daysValue, hoursValue, minutesValue, secondsValue] = match;
  const hasDatePart = daysValue !== undefined;
  const hasTimeMarker = value.includes("T");
  const hasTimePart =
    hoursValue !== undefined ||
    minutesValue !== undefined ||
    secondsValue !== undefined;

  if (!hasDatePart && !hasTimePart) {
    return undefined;
  }

  if (hasTimeMarker && !hasTimePart) {
    return undefined;
  }

  return toSafeSeconds([
    Number(daysValue ?? 0) * 24 * 60 * 60,
    Number(hoursValue ?? 0) * 60 * 60,
    Number(minutesValue ?? 0) * 60,
    Number(secondsValue ?? 0),
  ]);
}

export function formatDuration(
  durationSeconds: number | undefined,
): string | undefined {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 0
  ) {
    return undefined;
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours === 0) {
    return `${minutes}:${paddedSeconds}`;
  }

  return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}
