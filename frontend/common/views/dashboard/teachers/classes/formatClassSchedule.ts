import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

const SCHEDULE_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

const SCHEDULE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

/** Formats a class's scheduled start/end timestamps as a localized range. */
export function formatClassSchedule(
  scheduledStartAt: string | null | undefined,
  scheduledEndAt: string | null | undefined,
  locale: string
): string {
  if (!scheduledStartAt) {
    return "";
  }
  const start = new Date(scheduledStartAt);
  if (Number.isNaN(start.getTime())) {
    return "";
  }
  const localeTag = getLatnLocaleTag(locale);
  const datePart = getDateTimeFormatter(localeTag, SCHEDULE_DATE_OPTIONS).format(start);
  const timePart = getDateTimeFormatter(localeTag, SCHEDULE_TIME_OPTIONS).format(start);

  if (!scheduledEndAt) {
    return `${datePart} · ${timePart}`;
  }
  const end = new Date(scheduledEndAt);
  if (Number.isNaN(end.getTime())) {
    return `${datePart} · ${timePart}`;
  }
  const endTime = getDateTimeFormatter(localeTag, SCHEDULE_TIME_OPTIONS).format(end);
  return `${datePart} · ${timePart} – ${endTime}`;
}
