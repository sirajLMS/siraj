import type { AppLocale } from "@/shared/locale/AppLocale";

/** Formats an audit-domain ISO timestamp for display; falls back to the raw value when unparsable and "—" when absent. */
export function formatAuditTimestamp(isoTimestamp: string | null | undefined, locale: AppLocale): string {
  if (isoTimestamp === null || isoTimestamp === undefined || isoTimestamp === "") return "—";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
