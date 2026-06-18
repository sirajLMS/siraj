import { logger } from "@/backend/lib/logger";

export function formatInstantInTimezone(date: Date, ianaTimezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    logger.error("Failed to format date in timezone, falling back to UTC", {
      error,
      ianaTimezone,
      date: date.toISOString(),
    });
    // Fallback to UTC if timezone is invalid
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
}
