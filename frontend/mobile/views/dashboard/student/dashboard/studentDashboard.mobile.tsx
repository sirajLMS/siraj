"use client";

import { CalendarMonthOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainer, SectionPanel } from "@/frontend/common/components/ui";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { NextClassJoinCard } from "@/frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { MobileCardList, MobileContentStack } from "@/frontend/mobile/components/ui";

interface MobileUpcomingItemProps {
  readonly lesson: UpcomingLessonRow;
  readonly joinLabel: string;
  readonly onJoin: (id: string) => void;
}

function MobileUpcomingItem({ lesson, joinLabel, onJoin }: MobileUpcomingItemProps): ReactNode {
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
          {joinLabel}
        </Button>
      ) : null}
    </Box>
  );
}

interface MobileReportItemProps {
  readonly report: StudentDashboardViewModel["recentLessonReports"][number];
  readonly labels: StudentDashboardViewModel["labels"];
  readonly onAddReflection: (id: string) => void;
}

function MobileReportItem({ report, labels, onAddReflection }: MobileReportItemProps): ReactNode {
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
            {report.durationMinutes} min
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

export function StudentDashboardMobileView({
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
}: Readonly<StudentDashboardViewModel>) {
  if (loading && !nextLesson) {
    return (
      <PageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileContentStack>
        <Box>
          <Typography variant="headlineLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
            {labels.welcomeMessage.replace("{name}", userName ?? "")}
          </Typography>
        </Box>

        <NextClassJoinCard lesson={nextLesson} labels={labels} onJoin={onJoinLesson} />

        <SectionPanel title={labels.upcomingToday}>
          <MobileCardList<UpcomingLessonRow>
            rows={upcomingLessons.filter(l => {
              const today = new Date();
              const start = l.scheduledStartAt ? new Date(l.scheduledStartAt) : null;
              return (
                start !== null &&
                start.getUTCDate() === today.getUTCDate() &&
                start.getUTCMonth() === today.getUTCMonth()
              );
            })}
            emptyMessage={labels.noUpcomingClasses}
            getKey={row => row.id}
            renderItem={row => <MobileUpcomingItem lesson={row} joinLabel={labels.joinNow} onJoin={onJoinLesson} />}
          />
        </SectionPanel>

        <SectionPanel title={labels.creditBalance}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "stretch" }}>
            <Box sx={{ flex: 1 }}>
              <MetricCard
                icon={PaymentsOutlined}
                label={labels.classesRemaining}
                value={creditBalance.classesRemaining}
                variant="compact"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <MetricCard
                icon={SchoolOutlined}
                label={labels.classesTotal}
                value={creditBalance.classesTotal}
                variant="compact"
              />
            </Box>
          </Stack>
          <Button variant="text" sx={theme => ({ mt: 1, color: theme.palette.primary.main })} onClick={onViewCredits}>
            {labels.viewCredits}
          </Button>
        </SectionPanel>

        <SectionPanel title={labels.recentLessonReports}>
          <MobileCardList<StudentDashboardViewModel["recentLessonReports"][number]>
            rows={recentLessonReports}
            emptyMessage={labels.noLessonReports}
            getKey={row => row.id}
            renderItem={row => <MobileReportItem report={row} labels={labels} onAddReflection={onAddReflection} />}
          />
        </SectionPanel>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<CalendarMonthOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onViewHistory}
        >
          {labels.viewAllHistory}
        </Button>
      </MobileContentStack>
    </PageContainer>
  );
}
