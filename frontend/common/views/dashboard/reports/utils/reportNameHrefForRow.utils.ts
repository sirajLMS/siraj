// NEW FOR PLAN v5: shared pure-data helpers reused by both tier variants of
// the reports rows (mobile `*CardList`/desktop `*DataGrid`). Lifted out of
// the tier to comply with specs.md §3 N9 (no lowercase pure-data helpers in
// `frontend/{mobile,desktop}/**`).

import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { ReportLedgerRow, ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

export function reportNameHrefForRow(row: ReportLedgerRow, reportType: ReportType): string | undefined {
  if (!row.entityId) {
    return undefined;
  }
  if (reportType === "by_teacher") {
    return profileHrefForTeacher({ teacherId: row.entityId });
  }
  if (reportType === "by_student") {
    return studentHref(row.entityId);
  }
  return undefined;
}
