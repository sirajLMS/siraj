"use client";

import { HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { NextClassJoinCard } from "@/frontend/desktop/views/dashboard/student/dashboard/components/nextClassJoinCard.desktop";
import { StudentRecentReportsDataGrid } from "@/frontend/desktop/views/dashboard/student/dashboard/components/studentRecentReportsDataGrid.desktop";

export function StudentDashboardDesktopView({
  userName,
  locale,
  nextLesson,
  upcomingTodayCount,
  creditBalance,
  recentLessonReports,
  reportsPagination,
  labels,
  loading,
  onJoinLesson,
  onViewHistory,
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

      <Box sx={{ mb: 3 }}>
        <NextClassJoinCard lesson={nextLesson} labels={labels} locale={locale} onJoin={onJoinLesson} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopMetricCard
            icon={PaymentsOutlined}
            label={labels.classesRemaining}
            value={creditBalance.classesRemaining}
            subLabel={`${creditBalance.classesTotal} ${labels.classesTotal.toLowerCase()}`}
            onClick={onViewCredits}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopMetricCard icon={SchoolOutlined} label={labels.classesTotal} value={creditBalance.classesTotal} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopMetricCard icon={HistoryOutlined} label={labels.upcomingToday} value={upcomingTodayCount} />
        </Grid>
      </Grid>

      <DesktopSectionPanel
        title={labels.recentLessonReports}
        actions={
          <Button variant="text" sx={theme => ({ color: theme.palette.primary.main })} onClick={onViewHistory}>
            {labels.viewAllHistory}
          </Button>
        }
        sx={{ mb: 3 }}
      >
        <StudentRecentReportsDataGrid
          rows={recentLessonReports}
          labels={labels}
          locale={locale}
          loading={loading}
          pagination={reportsPagination}
          onAddReflection={onAddReflection}
        />
      </DesktopSectionPanel>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<HistoryOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onViewHistory}
        >
          {labels.viewAllHistory}
        </Button>
        <Button variant="text" sx={theme => ({ color: theme.palette.primary.main })} onClick={onViewCredits}>
          {labels.viewCredits}
        </Button>
      </Stack>
    </DesktopPageContainer>
  );
}
