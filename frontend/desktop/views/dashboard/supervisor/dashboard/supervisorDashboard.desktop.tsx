"use client";

import { CalendarMonthOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Grid, Stack, Typography } from "@mui/material";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import { DuesSummaryCardDesktop } from "@/frontend/desktop/views/dashboard/supervisor/dashboard/components/duesSummaryCard.desktop";
import { PendingReviewsHeroCardDesktop } from "@/frontend/desktop/views/dashboard/supervisor/dashboard/components/pendingReviewsHeroCard.desktop";

export function SupervisorDashboardDesktopView({
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
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.welcomeMessage(userName ?? "")} />

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

      <SectionPanel title={labels.monthlyReportsShortcut}>
        <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.5 }}>
            <CalendarMonthOutlined sx={theme => ({ color: theme.palette.primary.main })} />
            <Typography variant="bodyLg" sx={theme => ({ color: theme.palette.onSurface })}>
              {monthlySnapshot.label}
            </Typography>
          </Stack>
          <PrimaryPageAction onClick={onGoToMonthlyReports}>{labels.goToMonthlyReports}</PrimaryPageAction>
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
                  gap: 1.5,
                }}
              >
                <CheckCircleOutlined fontSize="small" sx={theme => ({ color: theme.palette.status.activeContainer })} />
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                  {item.lessonDate}
                </Typography>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {item.reviewedAt}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </SectionPanel>
    </PageContainer>
  );
}
