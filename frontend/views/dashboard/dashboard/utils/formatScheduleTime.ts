const localeTag = (locale: string) => (locale === "ar" ? "ar-EG" : "en-US");

function parseScheduleDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatScheduleTimeOnly(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }

  const parsed = parseScheduleDate(value);
  if (parsed) {
    return parsed.toLocaleTimeString(localeTag(locale), {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const withoutTimezone = value.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const timeMatch = withoutTimezone.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/i);
  return timeMatch?.[0] ?? withoutTimezone;
}

export function formatScheduleYourTime(
  yourTime: string | null | undefined,
  fallbackInstant: string | null | undefined,
  locale: string
): string {
  const instantSource =
    yourTime && parseScheduleDate(yourTime) && yourTime.includes("T") ? yourTime : fallbackInstant;
  const parsedInstant = parseScheduleDate(instantSource);

  const timeLabel = formatScheduleTimeOnly(yourTime ?? instantSource, locale);
  if (!parsedInstant || !timeLabel) {
    return timeLabel;
  }

  const weekday = parsedInstant.toLocaleDateString(localeTag(locale), { weekday: "long" });
  return `${weekday} - ${timeLabel}`;
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}
