"use client";

import { HistoryOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobileMetricCard,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { NextClassJoinCard } from "@/frontend/mobile/views/dashboard/student/dashboard/components/nextClassJoinCard.mobile";

interface MobileReportItemProps {
  readonly report: StudentDashboardViewModel["recentLessonReports"][number];
  readonly labels: StudentDashboardViewModel["labels"];
  readonly locale: StudentDashboardViewModel["locale"];
  readonly onAddReflection: (id: string) => void;
}

function statusSessionKey(status: LessonReportStatus | null): string {
  if (status === LessonReportStatus.Approved) return "completed";
  if (status === LessonReportStatus.Rejected) return "blocked";
  return "pending";
}

function MobileReportItem({ report, labels, locale, onAddReflection }: MobileReportItemProps): ReactNode {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
            {report.lessonDate ? formatDate(report.lessonDate, locale) : "—"}
          </Typography>
          {report.teacherName ? (
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {report.teacherName}
            </Typography>
          ) : null}
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {report.durationMinutes} min · {report.completionPercentage}%
          </Typography>
        </Box>
        {report.status ? (
          <MobileStatusBadge
            category="session"
            status={statusSessionKey(report.status)}
            label={report.status}
            size="small"
          />
        ) : null}
      </Stack>
      <Button
        size="small"
        variant="text"
        sx={theme => ({ mt: 1, color: theme.palette.primary.main })}
        onClick={() => {
          if (report.classInstanceId) onAddReflection(report.classInstanceId);
        }}
        disabled={!report.classInstanceId}
      >
        {labels.addReflection}
      </Button>
    </Box>
  );
}

export function StudentDashboardMobileView({
  userName,
  locale,
  nextLesson,
  upcomingTodayCount,
  creditBalance,
  recentLessonReports,
  labels,
  loading,
  onJoinLesson,
  onViewHistory,
  onViewCredits,
  onAddReflection,
}: Readonly<StudentDashboardViewModel>) {
  if (loading && !nextLesson && recentLessonReports.length === 0) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.welcomeMessage(userName ?? "")} subtitle={labels.pageTitle} />

        <NextClassJoinCard lesson={nextLesson} labels={labels} locale={locale} onJoin={onJoinLesson} />

        <Stack direction="row" spacing={2} sx={{ alignItems: "stretch" }}>
          <Box sx={{ flex: 1 }}>
            <MobileMetricCard
              icon={PaymentsOutlined}
              label={labels.classesRemaining}
              value={creditBalance.classesRemaining}
              variant="compact"
              onClick={onViewCredits}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <MobileMetricCard
              icon={SchoolOutlined}
              label={labels.classesTotal}
              value={creditBalance.classesTotal}
              variant="compact"
            />
          </Box>
        </Stack>

        <MobileMetricCard
          icon={HistoryOutlined}
          label={labels.upcomingToday}
          value={upcomingTodayCount}
          variant="compact"
        />

        <MobileSectionPanel title={labels.recentLessonReports}>
          <MobileCardList<StudentDashboardViewModel["recentLessonReports"][number]>
            rows={recentLessonReports}
            emptyMessage={labels.noLessonReports}
            getKey={row => row.id}
            renderItem={row => (
              <MobileReportItem report={row} labels={labels} locale={locale} onAddReflection={onAddReflection} />
            )}
          />
        </MobileSectionPanel>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<HistoryOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onViewHistory}
        >
          {labels.viewAllHistory}
        </Button>
        <Button variant="text" fullWidth sx={theme => ({ color: theme.palette.primary.main })} onClick={onViewCredits}>
          {labels.viewCredits}
        </Button>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
