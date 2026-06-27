import type { AttendanceReportFilters, AttendanceReportRow } from "@/backend/db/repo/report.repository";

export { ReportGroupingMode } from "@/backend/db/repo/report.repository";
export type { AttendanceReportFilters, AttendanceReportRow };

export interface AttendanceReportResult {
  readonly rows: AttendanceReportRow[];
  readonly engagementGrowth: number | null;
}
