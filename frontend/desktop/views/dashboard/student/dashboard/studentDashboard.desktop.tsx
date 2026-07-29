"use client";

import { HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel, desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { NextClassJoinCard } from "@/frontend/desktop/views/dashboard/student/dashboard/components/nextClassJoinCard.desktop";
import { StudentRecentReportsCardListDesktop } from "@/frontend/desktop/views/dashboard/student/dashboard/components/studentRecentReportsCardList.desktop";

export function StudentDashboardDesktopView({
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
  if (loading && !nextLesson && recentLessonReports.length === 0) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.welcomeMessage(userName ?? "")} subtitle={labels.pageTitle} />

      {nextLesson ? (
        <Box sx={{ mb: 3 }}>
          <NextClassJoinCard lesson={nextLesson} labels={labels} locale={locale} onJoin={onJoinLesson} />
        </Box>
      ) : null}

      <Box sx={{ mb: 3 }}>
        <DesktopMetricCardGrid
          metrics={
            [
              {
                key: "classes-remaining",
                count: creditBalance.classesRemaining,
                labelKey: "classes-remaining",
                label: labels.classesRemaining,
                icon: PaymentsOutlined,
                subLabel: `${creditBalance.classesTotal} ${labels.classesTotal.toLowerCase()}`,
              },
              {
                key: "classes-total",
                count: creditBalance.classesTotal,
                labelKey: "classes-total",
                label: labels.classesTotal,
                icon: SchoolOutlined,
              },
              {
                key: "upcoming-today",
                count: upcomingTodayCount,
                labelKey: "upcoming-today",
                label: labels.upcomingToday,
                icon: HistoryOutlined,
              },
            ] satisfies MetricItem[]
          }
          size={{ xs: 12, md: 4 }}
          onMetricClick={key => {
            if (key === "classes-remaining") {
              onViewCredits();
            }
          }}
        />
      </Box>

      {!nextLesson ? (
        <Box sx={{ ...desktopSectionContentInsetSx, py: 0, mb: 3 }}>
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
        </Box>
      ) : null}

      <DesktopSectionPanel contentPadding={false} title={labels.recentLessonReports} sx={{ mb: 3 }}>
        <StudentRecentReportsCardListDesktop
          rows={recentLessonReports}
          labels={labels}
          lessonReportStatusLabels={lessonReportStatusLabels}
          locale={locale}
          loading={loading}
          pagination={reportsPagination}
          onAddReflection={onAddReflection}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
