"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { buildRecentApprovalCardLabels } from "@/frontend/common/views/dashboard/supervisor/dashboard/__shared__/recentApprovalCardLabels";
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
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { DuesSummaryCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/duesSummaryCard.mobile";
import { PendingReviewsHeroCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.mobile";
import { RecentApprovalCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/recentApprovalCard.mobile";

export function SupervisorDashboardMobileView({
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
            <MobilePrimaryPageAction
              variant="text"
              onClick={onGoToMonthlyReports}
              sx={{ minWidth: "auto", px: 0, textAlign: "start" }}
            >
              {labels.goToMonthlyReports}
            </MobilePrimaryPageAction>
          </Stack>
        </MobileSectionPanel>

        <MobileSectionPanel title={labels.recentApprovals} contentInset={false}>
          <MobileCardList
            rows={recentApprovals}
            loading={recentApprovalsLoading}
            emptyMessage={labels.noRecentApprovals}
            getKey={item => item.id}
            paginationOptions={buildServerPaginationOptions({
              page: recentApprovalsPagination.page,
              pageSize: recentApprovalsPagination.pageSize,
              totalCount: recentApprovalsPagination.totalCount,
              onPageChange: recentApprovalsPagination.onPageChange,
              pageSizeOptions: [recentApprovalsPagination.pageSize],
            })}
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
