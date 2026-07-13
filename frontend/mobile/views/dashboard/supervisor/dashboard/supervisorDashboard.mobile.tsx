"use client";

import { CalendarMonthOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { PageContainer, SectionPanel } from "@/frontend/common/components/ui";
import { DuesSummaryCard } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/DuesSummaryCard";
import { PendingReviewsHeroCard } from "@/frontend/common/views/dashboard/supervisor/dashboard/components/PendingReviewsHeroCard";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import { MobileContentStack, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function SupervisorDashboardMobileView({
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
  return (
    <PageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage} />

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        <PendingReviewsHeroCard count={pendingReviewCount} labels={labels} onGoToReviews={onGoToReviews} />

        <DuesSummaryCard summary={pendingDuesSummary} labels={labels} onGoToDues={onGoToDues} />

        <SectionPanel title={labels.monthlyReportsShortcut}>
          <Stack sx={{ gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthOutlined fontSize="small" sx={theme => ({ color: theme.palette.primary.main })} />
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                {monthlySnapshot.label}
              </Typography>
            </Box>
            <Box
              component="button"
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
        </SectionPanel>

        <SectionPanel title={labels.recentApprovals}>
          {recentApprovals.length === 0 ? (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.noRecentApprovals}
            </Typography>
          ) : (
            <Stack sx={{ gap: 1.5 }}>
              {recentApprovals.map(item => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CheckCircleOutlined
                    fontSize="small"
                    sx={theme => ({ color: theme.palette.status.activeContainer })}
                  />
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                    {item.lessonDate}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </SectionPanel>
      </MobileContentStack>
    </PageContainer>
  );
}
