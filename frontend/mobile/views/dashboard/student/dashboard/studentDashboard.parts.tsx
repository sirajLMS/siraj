"use client";

import { Box, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobilePageContainer,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { NextClassJoinCard } from "@/frontend/mobile/views/dashboard/student/dashboard/components/nextClassJoinCard.mobile";
import { RecentLessonReportCardMobile } from "@/frontend/mobile/views/dashboard/student/dashboard/components/recentLessonReportCard.mobile";

export function StudentDashboardLoadingState({ message }: Readonly<{ message: string }>) {
  return (
    <MobilePageContainer>
      <Typography variant="bodyMd" sx={{ p: 3 }}>
        {message}
      </Typography>
    </MobilePageContainer>
  );
}

export function StudentDashboardNextClassSection({
  nextLesson,
  labels,
  locale,
  onJoin,
}: Readonly<{
  nextLesson: StudentDashboardViewModel["nextLesson"];
  labels: StudentDashboardViewModel["labels"];
  locale: StudentDashboardViewModel["locale"];
  onJoin: StudentDashboardViewModel["onJoinLesson"];
}>) {
  if (!nextLesson) return null;

  return (
    <MobileContentInset>
      <NextClassJoinCard lesson={nextLesson} labels={labels} locale={locale} onJoin={onJoin} />
    </MobileContentInset>
  );
}

export function StudentDashboardNoUpcomingClassesMessage({
  labels,
}: Readonly<{ labels: StudentDashboardViewModel["labels"] }>) {
  return (
    <MobileContentInset>
      <Box
        sx={theme => ({
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          backgroundColor: theme.palette.surfaceContainer,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.noUpcomingClasses}
        </Typography>
      </Box>
    </MobileContentInset>
  );
}

export function StudentDashboardRecentLessonReportsSection({
  recentLessonReports,
  reportsPagination,
  labels,
  lessonReportStatusLabels,
  locale,
  onAddReflection,
}: Readonly<
  Pick<
    StudentDashboardViewModel,
    "recentLessonReports" | "reportsPagination" | "labels" | "lessonReportStatusLabels" | "locale" | "onAddReflection"
  >
>) {
  return (
    <MobileSectionPanel title={labels.recentLessonReports} contentInset={false}>
      <MobileCardList<StudentDashboardViewModel["recentLessonReports"][number]>
        rows={recentLessonReports}
        emptyMessage={labels.noLessonReports}
        getKey={row => row.id}
        gap={2}
        layout="edge-to-edge"
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLowest,
          py: 2,
        })}
        paginationOptions={buildServerPaginationOptions({
          page: reportsPagination.page,
          pageSize: reportsPagination.pageSize,
          totalCount: reportsPagination.totalCount,
          onPageChange: reportsPagination.onPageChange,
        })}
        renderItem={row => (
          <MobileCardListItem
            variant="edge-to-edge"
            sx={theme => ({
              backgroundColor: theme.palette.surfaceContainer,
              borderRadius: 0,
              border: "none",
              borderBottom: "none",
            })}
          >
            <RecentLessonReportCardMobile
              report={row}
              labels={labels}
              lessonReportStatusLabels={lessonReportStatusLabels}
              locale={locale}
              onAddReflection={onAddReflection}
            />
          </MobileCardListItem>
        )}
      />
    </MobileSectionPanel>
  );
}
