export function formatScheduleTimeOnly(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const withoutTimezone = value.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const timeMatch = withoutTimezone.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/i);
  return timeMatch?.[0] ?? withoutTimezone;
}
