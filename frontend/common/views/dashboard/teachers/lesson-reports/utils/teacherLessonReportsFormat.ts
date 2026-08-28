import type { useAppLocale } from "@/shared/locale";

type AppLocaleValue = ReturnType<typeof useAppLocale>;

/**
 * Renders a stored ISO lesson date as a compact locale-aware date
 * (e.g. "Mon, Feb 2" / Arabic equivalent). Returns null when the report
 * has no recorded lesson date.
 */
export function formatLessonReportDate(lessonDate: string | null, locale: AppLocaleValue): string | null {
  if (!lessonDate) return null;
  return new Date(lessonDate).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
