import { getDateTimeFormatter, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import type { useAppLocale } from "@/shared/locale";

type AppLocaleValue = ReturnType<typeof useAppLocale>;

/** Module-level options object constant to leverage getDateTimeFormatter WeakMap cache. */
const LESSON_REPORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

/**
 * Renders a stored ISO lesson date as a compact locale-aware date
 * (e.g. "Mon, Feb 2" / Arabic equivalent). Returns null when the report
 * has no recorded lesson date.
 */
export function formatLessonReportDate(lessonDate: string | null | undefined, locale: AppLocaleValue): string | null {
  if (!lessonDate) return null;
  const parsed = parseDateInput(lessonDate);
  if (!parsed) return null;
  return getDateTimeFormatter(getLatnLocaleTag(locale), LESSON_REPORT_DATE_OPTIONS).format(parsed);
}
