import {
  formatRelativeTimezoneOffset,
  getTimezoneOffsetLabel,
  getTimezonePathLabel,
} from "@/frontend/common/lib/timezone";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

const localeTag = getLatnLocaleTag;

export interface ScheduleTimezoneOffsetDetail {
  readonly relativeOffset: string;
  readonly time: string;
  readonly timezoneName: string;
  readonly timezoneUtcOffset: string;
  readonly yourUtcOffset: string;
}

export function resolveScheduleInstant(value: string | null | undefined): Date {
  const parsed = parseScheduleDate(value);
  return parsed ?? new Date();
}

export function buildScheduleTimezoneOffsetDetail(params: {
  readonly timeValue: string | null | undefined;
  readonly timezone: string | null | undefined;
  readonly viewerTimezone: string;
  readonly locale: string;
  readonly at?: string | null;
}): ScheduleTimezoneOffsetDetail {
  const at = resolveScheduleInstant(params.at);
  const normalizedTimezone = params.timezone ?? null;

  return {
    relativeOffset: formatRelativeTimezoneOffset(normalizedTimezone, params.viewerTimezone, at),
    time: formatScheduleTimeOnly(params.timeValue, params.locale),
    timezoneName: normalizedTimezone ? getTimezonePathLabel(normalizedTimezone, params.locale) : "",
    timezoneUtcOffset: normalizedTimezone ? getTimezoneOffsetLabel(normalizedTimezone, params.locale, at) : "",
    yourUtcOffset: getTimezoneOffsetLabel(params.viewerTimezone, params.locale, at),
  };
}

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

  let withoutTimezone = value.trim();
  if (withoutTimezone.endsWith(")")) {
    const lastOpen = withoutTimezone.lastIndexOf("(");
    if (lastOpen !== -1) {
      withoutTimezone = withoutTimezone.slice(0, lastOpen).trim();
    }
  }
  const TIME_PATTERN = /\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/i;
  const timeMatch = TIME_PATTERN.exec(withoutTimezone);
  const result = timeMatch?.[0] ?? withoutTimezone;
  if (locale === "ar") {
    return result.replace(/\s?AM/i, " ص").replace(/\s?PM/i, " م");
  }
  return result;
}

export function formatScheduleYourTime(
  yourTime: string | null | undefined,
  fallbackInstant: string | null | undefined,
  locale: string
): string {
  const instantSource = yourTime && parseScheduleDate(yourTime) && yourTime.includes("T") ? yourTime : fallbackInstant;
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
