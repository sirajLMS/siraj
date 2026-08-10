"use client";

import { HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { NextClassJoinCard } from "@/frontend/mobile/views/dashboard/student/dashboard/components/nextClassJoinCard.mobile";
import { RecentLessonReportCardMobile } from "@/frontend/mobile/views/dashboard/student/dashboard/components/recentLessonReportCard.mobile";

function LoadingState({ message }: Readonly<{ message: string }>) {
  return (
    <MobilePageContainer>
      <Typography variant="bodyMd" sx={{ p: 3 }}>
        {message}
      </Typography>
    </MobilePageContainer>
  );
}

function NextClassSection({
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

function MetricsSection({
  metrics,
  onMetricClick,
}: Readonly<{
  metrics: readonly MetricItem[];
  onMetricClick: (key: string) => void;
}>) {
  return <MobileMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} />;
}

function NoUpcomingClassesMessage({ labels }: Readonly<{ labels: StudentDashboardViewModel["labels"] }>) {
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

function RecentLessonReportsSection({
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

export function StudentDashboardMobileView({
  userName,
  locale,
  nextLesson,
  upcomingTodayCount,
  creditBalance,
  recentLessonReports,
  reportsPagination,
  labels,
  lessonReportStatusLabels,
  loading,
  onJoinLesson,
  onViewCredits,
  onAddReflection,
}: Readonly<StudentDashboardViewModel>) {
  const metrics: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "remaining",
        label: labels.classesRemaining,
        count: creditBalance.classesRemaining,
        icon: PaymentsOutlined,
        labelKey: "remaining",
      },
      {
        key: "classesTotal",
        label: labels.classesTotal,
        count: creditBalance.classesTotal,
        icon: SchoolOutlined,
        labelKey: "classesTotal",
      },
      {
        key: "upcomingToday",
        label: labels.upcomingToday,
        count: upcomingTodayCount,
        icon: HistoryOutlined,
        labelKey: "upcomingToday",
      },
    ],
    [creditBalance.classesRemaining, creditBalance.classesTotal, labels, upcomingTodayCount]
  );

  if (loading && !nextLesson && recentLessonReports.length === 0) {
    return <LoadingState message={labels.loadingMessage} />;
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.welcomeMessage(userName ?? "")} subtitle={labels.pageTitle} />

        <NextClassSection nextLesson={nextLesson} labels={labels} locale={locale} onJoin={onJoinLesson} />

        <MetricsSection
          metrics={metrics}
          onMetricClick={key => {
            if (key === "remaining") onViewCredits();
          }}
        />

        <NoUpcomingClassesMessage labels={labels} />

        <RecentLessonReportsSection
          recentLessonReports={recentLessonReports}
          reportsPagination={reportsPagination}
          labels={labels}
          lessonReportStatusLabels={lessonReportStatusLabels}
          locale={locale}
          onAddReflection={onAddReflection}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
