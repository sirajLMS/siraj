"use client";

import { CalendarMonthOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import {
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { DuesSummaryCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/duesSummaryCard.mobile";
import { PendingReviewsHeroCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.mobile";

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
  onViewRecentApproval,
}: Readonly<SupervisorDashboardViewModel>) {
  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage(userName ?? "")} />

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
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

        <MobileSectionPanel title={labels.recentApprovals}>
          {recentApprovals.length === 0 ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.noRecentApprovals}
            </Typography>
          ) : (
            <Stack sx={{ gap: 1.5 }}>
              {recentApprovals.map(item => (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  onClick={() => onViewRecentApproval(item.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "start",
                    fontFamily: "inherit",
                    color: "inherit",
                  }}
                >
                  <CheckCircleOutlined
                    fontSize="small"
                    sx={theme => ({ color: theme.palette.status.activeContainer })}
                  />
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                    {[item.studentName, item.teacherName].filter(Boolean).join(" · ") || "—"}
                  </Typography>
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {item.lessonDate}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
