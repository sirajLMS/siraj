"use client";

import { CalendarMonthOutlined, HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type {
  RecentLessonReportRow,
  UpcomingLessonRow,
} from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopPageContainer, DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/page";
import { NextClassJoinCard } from "@/frontend/desktop/views/dashboard/student/dashboard/components/nextClassJoinCard.desktop";

interface DesktopUpcomingItemProps {
  readonly lesson: UpcomingLessonRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly onJoin: (id: string) => void;
}

function DesktopUpcomingItem({ lesson, labels, onJoin }: DesktopUpcomingItemProps): ReactNode {
  const start = lesson.scheduledStartAt
    ? new Date(lesson.scheduledStartAt).toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            {start}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {lesson.instructor}
          </Typography>
        </Box>
        {lesson.isFrozen ? (
          <Chip
            size="small"
            label="Frozen"
            sx={theme => ({
              backgroundColor: theme.palette.errorContainer,
              color: theme.palette.onErrorContainer,
            })}
          />
        ) : null}
      </Stack>
      {lesson.meetingJoinUrl ? (
        <Button
          size="small"
          variant="outlined"
          sx={theme => ({ mt: 1, color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={() => onJoin(lesson.id)}
        >
          {labels.joinNow}
        </Button>
      ) : null}
    </Box>
  );
}

interface DesktopReportItemProps {
  readonly report: RecentLessonReportRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly onAddReflection: (id: string) => void;
}

function DesktopReportItem({ report, labels, onAddReflection }: DesktopReportItemProps): ReactNode {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
            {report.lessonDate ?? "—"}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {report.durationMinutes} min · {report.completionPercentage}% · {report.attendanceEvaluation ?? ""}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={report.status ?? ""}
          sx={theme => ({
            backgroundColor: theme.palette.secondaryContainer,
            color: theme.palette.onSecondaryContainer,
          })}
        />
      </Stack>
      <Button
        size="small"
        variant="text"
        sx={theme => ({ mt: 1, color: theme.palette.primary.main })}
        onClick={() => onAddReflection(report.id)}
      >
        {labels.addReflection}
      </Button>
    </Box>
  );
}

export function StudentDashboardDesktopView({
  userName,
  nextLesson,
  upcomingLessons,
  creditBalance,
  recentLessonReports,
  labels,
  loading,
  onJoinLesson,
  onViewHistory,
  onViewCredits,
  onAddReflection,
  onEditProfile,
}: Readonly<StudentDashboardViewModel>) {
  if (loading && !nextLesson) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  const todaysLessons = upcomingLessons.filter(l => {
    const today = new Date();
    const start = l.scheduledStartAt ? new Date(l.scheduledStartAt) : null;
    return start !== null && start.getUTCDate() === today.getUTCDate() && start.getUTCMonth() === today.getUTCMonth();
  });

  return (
    <DesktopPageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="headlineLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
          {labels.welcomeMessage(userName ?? "")}
        </Typography>
        <Button variant="text" sx={theme => ({ mt: 1, color: theme.palette.primary.main })} onClick={onEditProfile}>
          {labels.pageTitle}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <NextClassJoinCard lesson={nextLesson} labels={labels} onJoin={onJoinLesson} />
            <DesktopSectionPanel title={labels.upcomingToday}>
              <Stack spacing={2}>
                {todaysLessons.length === 0 ? (
                  <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {labels.noUpcomingClasses}
                  </Typography>
                ) : (
                  todaysLessons.map(l => (
                    <DesktopUpcomingItem key={l.id} lesson={l} labels={labels} onJoin={onJoinLesson} />
                  ))
                )}
              </Stack>
            </DesktopSectionPanel>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <DesktopSectionPanel title={labels.creditBalance} sx={{ height: "100%" }}>
            <Stack spacing={2}>
              <DesktopMetricCard
                icon={PaymentsOutlined}
                label={labels.classesRemaining}
                value={creditBalance.classesRemaining}
                variant="compact"
              />
              <DesktopMetricCard
                icon={SchoolOutlined}
                label={labels.classesTotal}
                value={creditBalance.classesTotal}
                variant="compact"
              />
              <Button
                variant="outlined"
                fullWidth
                sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
                onClick={onViewCredits}
              >
                {labels.viewCredits}
              </Button>
              <Button
                variant="text"
                fullWidth
                startIcon={<HistoryOutlined />}
                sx={theme => ({ color: theme.palette.primary.main })}
                onClick={onViewHistory}
              >
                {labels.viewAllHistory}
              </Button>
            </Stack>
          </DesktopSectionPanel>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <DesktopSectionPanel title={labels.recentLessonReports} sx={{ height: "100%" }}>
            <Stack spacing={2}>
              {recentLessonReports.length === 0 ? (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {labels.noLessonReports}
                </Typography>
              ) : (
                recentLessonReports.map(r => (
                  <DesktopReportItem key={r.id} report={r} labels={labels} onAddReflection={onAddReflection} />
                ))
              )}
            </Stack>
          </DesktopSectionPanel>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onViewHistory}
        >
          {labels.viewAllHistory}
        </Button>
      </Box>
    </DesktopPageContainer>
  );
}
