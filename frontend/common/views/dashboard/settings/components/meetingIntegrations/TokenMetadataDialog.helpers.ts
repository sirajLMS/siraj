import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";

const MEDIUM_SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function formatDate(date: Date | null | undefined, locale: "en" | "ar"): string {
  if (!date) {
    return "—";
  }
  return getDateTimeFormatter(locale === "ar" ? "ar" : "en", MEDIUM_SHORT_OPTIONS).format(date);
}
