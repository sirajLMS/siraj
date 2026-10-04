"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { PaginationControls } from "@/frontend/common/components/ui";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type {
  ReportsPagination,
  StudentDashboardViewModel,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { RecentLessonReportCardDesktop } from "@/frontend/desktop/views/dashboard/student/dashboard/components/studentRecentReportsCardList.desktop.parts";
import type { AppLocale } from "@/shared/locale";

interface StudentRecentReportsCardListDesktopProps {
  readonly rows: readonly RecentLessonReportRow[];
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: AppLocale;
  readonly loading: boolean;
  readonly pagination: ReportsPagination;
  readonly onAddReflection: (classInstanceId: string) => void;
}

export function StudentRecentReportsCardListDesktop({
  rows,
  labels,
  lessonReportStatusLabels,
  locale,
  loading,
  pagination,
  onAddReflection,
}: Readonly<StudentRecentReportsCardListDesktopProps>) {
  const pageCount = Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize));

  const isLoadingAndEmpty = loading && rows.length === 0;
  const isEmpty = rows.length === 0;

  let bodyContent: React.ReactNode;
  if (isLoadingAndEmpty) {
    bodyContent = (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, px: 2 })}>
        {labels.loadingMessage}
      </Typography>
    );
  } else if (isEmpty) {
    bodyContent = (
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, px: 2 })}>
        {labels.noLessonReports}
      </Typography>
    );
  } else {
    bodyContent = (
      <Stack sx={{ gap: 2 }}>
        {rows.map(row => (
          <Paper
            key={row.id}
            elevation={0}
            sx={theme => ({
              backgroundColor: theme.palette.surfaceContainer,
              borderRadius: 0,
              border: "none",
              boxShadow: "none",
              overflow: "hidden",
              width: "100%",
              px: 2,
              py: 2,
            })}
          >
            <RecentLessonReportCardDesktop
              report={row}
              labels={labels}
              lessonReportStatusLabels={lessonReportStatusLabels}
              locale={locale}
              onAddReflection={onAddReflection}
            />
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        py: 2,
      })}
    >
      {bodyContent}

      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: rows.length > 0 ? 2 : 0 }}>
        <PaginationControls
          page={pagination.page}
          pageCount={pageCount}
          rowCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      </Box>
    </Box>
  );
}
