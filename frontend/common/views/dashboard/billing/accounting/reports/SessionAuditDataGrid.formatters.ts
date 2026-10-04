import { getDateTimeFormatter, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import { COMPACT_SESSION_TIME_FORMAT } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.constants";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

/**
 * Compact date-time for the grid's timestamp cells. Mirrors the shared cell
 * formatter contract: invalid input passes through verbatim when it carries
 * text, otherwise the cell placeholder wins.
 */
export function formatCompactSessionTime(
  value: Date | string | number | null | undefined,
  locale: string,
  fallbackText: string
): string {
  const parsed = parseDateInput(value);
  if (parsed !== null) {
    return getDateTimeFormatter(getLatnLocaleTag(locale), COMPACT_SESSION_TIME_FORMAT).format(parsed);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallbackText;
}
