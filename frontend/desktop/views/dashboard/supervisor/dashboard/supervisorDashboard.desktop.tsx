"use client";

import { CalendarMonthOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Grid, Stack, Typography } from "@mui/material";
import type { SupervisorDashboardViewModel } from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
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
  onViewRecentApproval,
}: Readonly<SupervisorDashboardViewModel>) {
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

      <DesktopSectionPanel title={labels.recentApprovals}>
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
                  gap: 1.5,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "start",
                  fontFamily: "inherit",
                  color: "inherit",
                  "&:hover": { opacity: 0.85 },
                }}
              >
                <CheckCircleOutlined fontSize="small" sx={theme => ({ color: theme.palette.status.activeContainer })} />
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
                  {item.studentName || item.studentId} · {item.teacherName || item.teacherId}
                </Typography>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {item.lessonDate}
                </Typography>
                <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {item.reviewedAt}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
