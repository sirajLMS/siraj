"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { formatLessonReportDate } from "@/frontend/common/views/dashboard/teachers/lesson-reports/utils/teacherLessonReportsFormat";

type LessonReportRow = TeacherLessonReportsViewModel["rows"][number];
type ColumnLabels = TeacherLessonReportsViewModel["labelsBySection"]["columns"];
type Locale = TeacherLessonReportsViewModel["locale"];
type ResolveStatusLabel = TeacherLessonReportsViewModel["resolveStatusLabel"];

/**
 * Desktop grid column contract for the teacher lesson reports history:
 * lesson date, status badge, duration, completion percentage, and a
 * truncated teacher-notes excerpt.
 */
export function buildTeacherLessonReportColumns({
  labels,
  locale,
  resolveStatusLabel,
}: Readonly<{
  labels: ColumnLabels;
  locale: Locale;
  resolveStatusLabel: ResolveStatusLabel;
}>): GridColDef<LessonReportRow>[] {
  return [
    {
      field: "lessonDate",
      headerName: labels.lessonDate,
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => formatLessonReportDate(row.lessonDate, locale) ?? "-",
    },
    {
      field: "status",
      headerName: labels.status,
      width: 150,
      renderCell: params =>
        params.row.status ? (
          <StatusBadge
            category="classInstance"
            status={params.row.status}
            label={resolveStatusLabel(params.row.status)}
          />
        ) : null,
    },
    {
      field: "durationMinutes",
      headerName: labels.durationMinutes,
      width: 150,
      valueGetter: (_value, row) => row.durationMinutes ?? "-",
    },
    {
      field: "completionPercentage",
      headerName: labels.completionPercentage,
      width: 160,
      valueGetter: (_value, row) => (row.completionPercentage == null ? "-" : `${row.completionPercentage}%`),
    },
    {
      field: "teacherNotes",
      headerName: labels.teacherNotes,
      flex: 1.5,
      minWidth: 200,
      valueGetter: (_value, row) => row.teacherNotes ?? "-",
    },
  ];
}
