"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { PaginationControls } from "@/frontend/common/components/ui";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { RecentLessonReportCompletionBar } from "@/frontend/common/views/dashboard/student/dashboard/components/recentLessonReportCompletionBar.shared";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type {
  ReportsPagination,
  StudentDashboardViewModel,
} from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  formatRecentLessonReportDuration,
  lessonReportStatusSessionKey,
  resolveLessonReportStatusLabel,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";
import {
  DesktopClassProfileLinkCell,
  DesktopPersonProfileLinkCell,
  DesktopStatusBadge,
} from "@/frontend/desktop/components/ui";
import type { AppLocale } from "@/shared/locale";

interface RecentLessonReportCardDesktopProps {
  readonly report: RecentLessonReportRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: AppLocale;
  readonly onAddReflection: (classInstanceId: string) => void;
}

function MetaSeparator() {
  return (
    <Typography
      component="span"
      variant="labelMd"
      sx={theme => ({ color: theme.palette.onSurfaceVariant, flexShrink: 0, lineHeight: 1 })}
    >
      •
    </Typography>
  );
}

const metaRowTruncateSx = {
  minWidth: 0,
  flex: "1 1 auto",
  overflow: "hidden",
  "& .MuiTypography-root": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} as const;

function RecentLessonReportCardDesktop({
  report,
  labels,
  lessonReportStatusLabels,
  locale,
  onAddReflection,
}: Readonly<RecentLessonReportCardDesktopProps>) {
  const subjectName = report.subjectName?.trim() || "—";
  const teacherName = report.teacherName?.trim() || "—";
  const statusLabel = resolveLessonReportStatusLabel(report.status, lessonReportStatusLabels);
  const durationLabel = formatRecentLessonReportDuration(report.durationMinutes);

  return (
    <Stack sx={{ gap: 1, width: "100%" }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
          <DesktopClassProfileLinkCell
            href={report.classInstanceId ? classHref(report.classInstanceId) : undefined}
            name={subjectName}
            avatarUrl={report.classAvatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />
        </Box>
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {report.status ? (
            <DesktopStatusBadge
              category="session"
              status={lessonReportStatusSessionKey(report.status)}
              label={statusLabel}
              size="small"
            />
          ) : null}
          <Button
            size="small"
            variant="text"
            sx={theme => ({
              flexShrink: 0,
              px: 0.5,
              minWidth: 0,
              color: theme.palette.primary.main,
              fontWeight: 700,
              whiteSpace: "nowrap",
            })}
            onClick={() => {
              if (report.classInstanceId) onAddReflection(report.classInstanceId);
            }}
            disabled={!report.classInstanceId}
          >
            {labels.addReflection}
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          minWidth: 0,
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        <Box sx={metaRowTruncateSx}>
          <DesktopPersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: report.teacherId })}
            name={teacherName}
            avatarUrl={report.teacherAvatarUrl}
            avatarSize={28}
            typographyVariant="labelMd"
            fontWeight={600}
          />
        </Box>
        <MetaSeparator />
        <Box sx={{ flexShrink: 0 }}>
          <DateTimeTooltipDisplay value={report.lessonDate} locale={locale} tone="muted" typographyVariant="labelMd" />
        </Box>
        <MetaSeparator />
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, flexShrink: 0, whiteSpace: "nowrap" })}
        >
          {durationLabel}
        </Typography>
      </Box>

      <RecentLessonReportCompletionBar completionPercentage={report.completionPercentage} />
    </Stack>
  );
}

interface StudentRecentReportsCardListDesktopProps {
  readonly rows: readonly RecentLessonReportRow[];
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: AppLocale;
  readonly loading: boolean;
  readonly pagination: ReportsPagination;
  readonly onAddReflection: (classInstanceId: string) => void;
}

export function StudentRecentReportsCardListDesktop({
  rows,
  labels,
  lessonReportStatusLabels,
  locale,
  loading,
  pagination,
  onAddReflection,
}: Readonly<StudentRecentReportsCardListDesktopProps>) {
  const pageCount = Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize));

  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        py: 2,
      })}
    >
      {loading && rows.length === 0 ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, px: 2 })}>
          {labels.loadingMessage}
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, px: 2 })}>
          {labels.noLessonReports}
        </Typography>
      ) : (
        <Stack sx={{ gap: 2 }}>
          {rows.map(row => (
            <Paper
              key={row.id}
              elevation={0}
              sx={theme => ({
                backgroundColor: theme.palette.surfaceContainer,
                borderRadius: 0,
                border: "none",
                boxShadow: "none",
                overflow: "hidden",
                width: "100%",
                px: 2,
                py: 2,
              })}
            >
              <RecentLessonReportCardDesktop
                report={row}
                labels={labels}
                lessonReportStatusLabels={lessonReportStatusLabels}
                locale={locale}
                onAddReflection={onAddReflection}
              />
            </Paper>
          ))}
        </Stack>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", pt: rows.length > 0 ? 2 : 0 }}>
        <PaginationControls
          page={pagination.page}
          pageCount={pageCount}
          rowCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      </Box>
    </Box>
  );
}
