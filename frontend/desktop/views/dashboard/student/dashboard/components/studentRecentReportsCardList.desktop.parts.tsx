"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { RecentLessonReportCompletionBar } from "@/frontend/common/views/dashboard/student/dashboard/components/recentLessonReportCompletionBar.shared";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
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

function MetaSeparator() {
  return (
    <Box
      component="span"
      sx={theme => ({
        fontSize: theme.typography.labelMd.fontSize,
        fontWeight: theme.typography.labelMd.fontWeight,
        color: theme.palette.onSurfaceVariant,
        flexShrink: 0,
        lineHeight: 1,
      })}
    >
      •
    </Box>
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

interface RecentLessonReportCardDesktopProps {
  readonly report: RecentLessonReportRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: AppLocale;
  readonly onAddReflection: (classInstanceId: string) => void;
}

export function RecentLessonReportCardDesktop({
  report,
  labels,
  lessonReportStatusLabels,
  locale,
  onAddReflection,
}: Readonly<RecentLessonReportCardDesktopProps>) {
  const subjectName = report.subjectName?.trim() ?? "—";
  const teacherName = report.teacherName?.trim() ?? "—";
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
