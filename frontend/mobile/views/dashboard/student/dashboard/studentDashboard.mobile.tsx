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
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.welcomeMessage(userName ?? "")} subtitle={labels.pageTitle} />

        {nextLesson ? (
          <MobileContentInset>
            <NextClassJoinCard lesson={nextLesson} labels={labels} locale={locale} onJoin={onJoinLesson} />
          </MobileContentInset>
        ) : null}

        <MobileMetricCardGrid
          metrics={metrics}
          onMetricClick={key => {
            if (key === "remaining") onViewCredits();
          }}
        />

        {!nextLesson ? (
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
        ) : null}

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
      </MobileContentStack>
    </MobilePageContainer>
  );
}
