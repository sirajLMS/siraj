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

export function getDayBoundaries(date: Date, ianaTimezone: string): { startOfDayUtc: Date; endOfDayUtc: Date } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);

    const yearPart = parts.find(p => p.type === "year")?.value;
    const monthPart = parts.find(p => p.type === "month")?.value;
    const dayPart = parts.find(p => p.type === "day")?.value;

    if (!yearPart || !monthPart || !dayPart) {
      throw new Error("Missing date parts");
    }

    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10) - 1;
    const day = Number.parseInt(dayPart, 10);

    const getOffsetMs = (d: Date) => {
      const utcDate = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
      const tzDate = new Date(d.toLocaleString("en-US", { timeZone: ianaTimezone }));
      return tzDate.getTime() - utcDate.getTime();
    };

    const guessStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const offsetStart = getOffsetMs(guessStart);
    let startOfDayUtc = new Date(guessStart.getTime() - offsetStart);
    startOfDayUtc = new Date(guessStart.getTime() - getOffsetMs(startOfDayUtc));

    const guessEnd = new Date(Date.UTC(year, month, day, 24, 0, 0));
    const offsetEnd = getOffsetMs(guessEnd);
    let endOfDayUtc = new Date(guessEnd.getTime() - offsetEnd);
    endOfDayUtc = new Date(guessEnd.getTime() - getOffsetMs(endOfDayUtc));

    return { startOfDayUtc, endOfDayUtc };
  } catch (error) {
    logger.error("Failed to calculate day boundaries, falling back to UTC", {
      error,
      ianaTimezone,
      date: date.toISOString(),
    });
    const startOfDayUtc = new Date(date);
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    const endOfDayUtc = new Date(date);
    endOfDayUtc.setUTCHours(24, 0, 0, 0);
    return { startOfDayUtc, endOfDayUtc };
  }
}
