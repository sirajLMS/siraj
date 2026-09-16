import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { AppLocale } from "@/shared/locale/AppLocale";

const AUDIT_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/** Formats an audit-domain ISO timestamp for display; falls back to the raw value when unparsable and "—" when absent. */
export function formatAuditTimestamp(isoTimestamp: string | null | undefined, locale: AppLocale): string {
  if (isoTimestamp === null || isoTimestamp === undefined || isoTimestamp === "") return "—";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const localeTag = locale === "ar" ? "ar" : "en";
  return getDateTimeFormatter(localeTag, AUDIT_TIMESTAMP_OPTIONS).format(date);
}
