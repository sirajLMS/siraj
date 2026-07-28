"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { RecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import {
  RecentApprovalCardSkeleton,
  RecentApprovalEmptyState,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { DuesSummaryCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/duesSummaryCard.mobile";
import { PendingReviewsHeroCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.mobile";
import { RecentApprovalCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/recentApprovalCard.mobile";

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

export function SupervisorDashboardMobileView({
  userName,
  pendingReviewCount,
  pendingDuesSummary,
  monthlySnapshot,
  recentApprovals,
  labels,
  loading,
  onGoToReviews,
  onGoToDues,
  onGoToMonthlyReports,
}: Readonly<SupervisorDashboardViewModel>) {
  const cardLabels = buildRecentApprovalCardLabels(labels);

  return (
    <MobilePageContainer>
      <MobileContentStack gap={0}>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage(userName ?? "")} />

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, px: 2, py: 1 })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        <PendingReviewsHeroCardMobile count={pendingReviewCount} labels={labels} onGoToReviews={onGoToReviews} />

        <DuesSummaryCardMobile summary={pendingDuesSummary} labels={labels} onGoToDues={onGoToDues} />

        <MobileSectionPanel title={labels.monthlyReportsShortcut}>
          <Stack sx={{ gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                {monthlySnapshot.label}
              </Typography>
            </Box>
            <Box
              component="button"
              type="button"
              onClick={onGoToMonthlyReports}
              sx={theme => ({
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: theme.palette.primary.main,
                fontFamily: "inherit",
                fontSize: "inherit",
                textAlign: "start",
              })}
            >
              {labels.goToMonthlyReports}
            </Box>
          </Stack>
        </MobileSectionPanel>

        <MobileSectionPanel title={labels.recentApprovals} contentInset={false}>
          <MobileCardList
            rows={recentApprovals}
            loading={loading}
            emptyMessage={labels.noRecentApprovals}
            getKey={item => item.id}
            paginationOptions={false}
            layout="edge-to-edge"
            gap={0}
            renderSkeleton={() => (
              <MobileCardListItem variant="edge-to-edge">
                <RecentApprovalCardSkeleton />
              </MobileCardListItem>
            )}
            renderEmptyState={msg => (
              <MobileCardListItem variant="edge-to-edge">
                <RecentApprovalEmptyState message={msg} />
              </MobileCardListItem>
            )}
            renderItem={item => (
              <MobileCardListItem variant="edge-to-edge">
                <RecentApprovalCardMobile item={item} labels={cardLabels} />
              </MobileCardListItem>
            )}
          />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
