"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import { ScheduleOverviewListShell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell";
import { scheduleOverviewListCanvasSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { RecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import {
  RecentApprovalCardSkeleton,
  RecentApprovalEmptyState,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DuesSummaryCardDesktop } from "@/frontend/desktop/views/dashboard/supervisor/dashboard/components/duesSummaryCard.desktop";
import { PendingReviewsHeroCardDesktop } from "@/frontend/desktop/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.desktop";
import { RecentApprovalDesktopCard } from "@/frontend/desktop/views/dashboard/supervisor/dashboard/components/recentApprovalCard.desktop";

function buildRecentApprovalCardLabels(labels: SupervisorDashboardViewModel["labels"]): RecentApprovalCardLabels {
  return {
    approvedTime: labels.approvedTime,
    lessonDate: labels.lessonDate,
    duration: labels.duration,
    completion: labels.completion,
    teacher: labels.teacher,
    student: labels.student,
    viewReport: labels.viewReport,
    viewClass: labels.viewClass,
    history: labels.history,
    approvedStatus: labels.approvedStatus,
  };
}

export function SupervisorDashboardDesktopView({
  userName,
  pendingReviewCount,
  pendingDuesSummary,
  monthlySnapshot,
  recentApprovals,
  recentApprovalsPagination,
  labels,
  loading,
  recentApprovalsLoading,
  onGoToReviews,
  onGoToDues,
  onGoToMonthlyReports,
}: Readonly<SupervisorDashboardViewModel>) {
  const cardLabels = buildRecentApprovalCardLabels(labels);
  const { page, pageSize, totalCount, onPageChange } = recentApprovalsPagination;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage(userName ?? "")} />

      {loading ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.loadingMessage}
        </Typography>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PendingReviewsHeroCardDesktop count={pendingReviewCount} labels={labels} onGoToReviews={onGoToReviews} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DuesSummaryCardDesktop summary={pendingDuesSummary} labels={labels} onGoToDues={onGoToDues} />
        </Grid>
      </Grid>

      <DesktopSectionPanel title={labels.monthlyReportsShortcut}>
        <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
            <CalendarMonthOutlined sx={theme => ({ color: theme.palette.primary.main })} />
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onSurface })}>
              {monthlySnapshot.label}
            </Typography>
          </Stack>
          <DesktopPrimaryPageAction onClick={onGoToMonthlyReports}>
            {labels.goToMonthlyReports}
          </DesktopPrimaryPageAction>
        </Stack>
      </DesktopSectionPanel>

      <DesktopSectionPanel contentPadding={false} title={labels.recentApprovals}>
        <Box sx={scheduleOverviewListCanvasSx}>
          <ScheduleOverviewListShell
            rows={recentApprovals}
            getKey={item => item.id}
            loading={recentApprovalsLoading}
            emptyMessage={labels.noRecentApprovals}
            renderItem={item => <RecentApprovalDesktopCard item={item} labels={cardLabels} />}
            renderEmptyState={() => (
              <Box sx={{ py: 2 }}>
                <RecentApprovalEmptyState message={labels.noRecentApprovals} />
              </Box>
            )}
            renderSkeleton={() => (
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={theme => ({
                    borderRadius: 0,
                    border: "none",
                    borderBottom: `1px solid ${theme.palette.outlineVariant}`,
                    backgroundColor: theme.palette.surfaceContainer,
                  })}
                >
                  <RecentApprovalCardSkeleton />
                </Paper>
              </Stack>
            )}
            pagination={{
              page,
              pageCount,
              rowCount: totalCount,
              pageSize,
              onPageChange,
            }}
          />
        </Box>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
