"use client";

import { Box, Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import type { AppLocale } from "@/shared/locale";

interface StudentRecentReportsDataGridProps {
  readonly rows: readonly RecentLessonReportRow[];
  readonly labels: StudentDashboardViewModel["labels"];
  readonly locale: AppLocale;
  readonly loading: boolean;
  readonly onAddReflection: (classInstanceId: string) => void;
}

function statusSessionKey(status: LessonReportStatus | null): string {
  if (status === LessonReportStatus.Approved) return "completed";
  if (status === LessonReportStatus.Rejected) return "blocked";
  return "pending";
}

export function StudentRecentReportsDataGrid({
  rows,
  labels,
  locale,
  loading,
  onAddReflection,
}: Readonly<StudentRecentReportsDataGridProps>) {
  const columns = useMemo<GridColDef<RecentLessonReportRow>[]>(
    () => [
      {
        field: "lessonDate",
        headerName: "",
        flex: 1.4,
        minWidth: 180,
        renderCell: ({ row }) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 600 })}>
              {row.lessonDate ? formatDate(row.lessonDate, locale) : "—"}
            </Typography>
            {row.teacherName ? (
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {row.teacherName}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        field: "durationMinutes",
        headerName: "",
        width: 160,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {row.durationMinutes} min · {row.completionPercentage}%
            {row.attendanceEvaluation ? ` · ${row.attendanceEvaluation}` : ""}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "",
        width: 140,
        renderCell: ({ row }) =>
          row.status ? (
            <DesktopStatusBadge
              category="session"
              status={statusSessionKey(row.status)}
              label={row.status}
              size="small"
            />
          ) : null,
      },
      {
        field: "actions",
        headerName: "",
        width: 150,
        sortable: false,
        renderCell: ({ row }) => (
          <Button
            size="small"
            variant="text"
            disabled={!row.classInstanceId}
            onClick={() => {
              if (row.classInstanceId) onAddReflection(row.classInstanceId);
            }}
            sx={theme => ({ color: theme.palette.primary.main })}
          >
            {labels.addReflection}
          </Button>
        ),
      },
    ],
    [labels, locale, onAddReflection]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <DesktopAppDataGrid
        rows={[...rows]}
        columns={columns}
        getRowId={row => row.id}
        loading={loading}
        emptyMessage={labels.noLessonReports}
        hideFooter
        autoHeight
        ariaLabel={labels.recentLessonReports}
      />
    </Box>
  );
}
