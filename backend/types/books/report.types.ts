import type { AttendanceReportRow } from "@/backend/db/repo/books/report.repository";

export type { AttendanceReportFilters, AttendanceReportRow } from "@/backend/db/repo/books/report.repository";
export { ReportGroupingMode } from "@/backend/db/repo/books/report.repository";

export interface AttendanceReportResult {
  readonly rows: AttendanceReportRow[];
  readonly engagementGrowth: number | null;
}
