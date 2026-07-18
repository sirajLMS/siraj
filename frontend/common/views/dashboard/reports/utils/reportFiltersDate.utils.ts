// NEW FOR PLAN v5: shared pure-data helpers that convert between the reports
// filter ISO `yyyy-MM-dd` string form and `Date` objects, so tier components
// do not need to import `date-fns` directly (specs.md §3 N10 forbids direct
// date-fns imports in `frontend/{mobile,desktop}/**`).

import { format, isValid, parse } from "date-fns";

export const REPORT_DATE_FILTER_FORMAT = "yyyy-MM-dd";

export function parseReportFilterDate(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, REPORT_DATE_FILTER_FORMAT, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

export function formatReportFilterDate(date: Date | null): string {
  return date && isValid(date) ? format(date, REPORT_DATE_FILTER_FORMAT) : "";
}
