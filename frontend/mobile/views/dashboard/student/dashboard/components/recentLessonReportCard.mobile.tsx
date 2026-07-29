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
import { MobilePersonProfileLinkCell, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";

interface RecentLessonReportCardMobileProps {
  readonly report: RecentLessonReportRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: StudentDashboardViewModel["locale"];
  readonly onAddReflection: StudentDashboardViewModel["onAddReflection"];
}

const metaTruncateTextSx = {
  minWidth: 0,
  overflow: "hidden",
  flex: "1 1 auto",
  "& .MuiTypography-root": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} as const;

const teacherMetaSx = {
  ...metaTruncateTextSx,
  minWidth: 0,
  "& a": {
    display: "block",
    minWidth: 0,
    overflow: "hidden",
  },
} as const;

const dateDurationMetaSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  minWidth: 0,
  overflow: "hidden",
  justifyContent: "flex-end",
} as const;

const metaRowSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: 0.75,
  minWidth: 0,
  overflow: "hidden",
} as const;

const narrowMobileMaxWidth = 400;

const reflectionButtonSx = {
  flexShrink: 0,
  px: 0.5,
  minWidth: 0,
  typography: "labelSm",
  fontWeight: 700,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
} as const;

function MetaSeparator() {
  return (
    <Typography
      component="span"
      variant="labelSm"
      sx={theme => ({ color: theme.palette.onSurfaceVariant, flexShrink: 0, lineHeight: 1 })}
    >
      •
    </Typography>
  );
}

interface AddReflectionButtonProps {
  readonly label: string;
  readonly classInstanceId: string | null | undefined;
  readonly onAddReflection: StudentDashboardViewModel["onAddReflection"];
  readonly layout?: "inline" | "stacked";
}

function AddReflectionButton({
  label,
  classInstanceId,
  onAddReflection,
  layout = "inline",
}: Readonly<AddReflectionButtonProps>) {
  const isStacked = layout === "stacked";

  return (
    <Button
      size="small"
      variant={isStacked ? "outlined" : "text"}
      fullWidth={isStacked}
      sx={theme => ({
        ...reflectionButtonSx,
        color: theme.palette.primary.main,
        ...(isStacked
          ? {
              borderColor: theme.palette.primary.main,
              width: "100%",
            }
          : {}),
      })}
      onClick={() => {
        if (classInstanceId) onAddReflection(classInstanceId);
      }}
      disabled={!classInstanceId}
    >
      {label}
    </Button>
  );
}

export function RecentLessonReportCardMobile({
  report,
  labels,
  lessonReportStatusLabels,
  locale,
  onAddReflection,
}: Readonly<RecentLessonReportCardMobileProps>) {
  const subjectName = report.subjectName?.trim() || "—";
  const teacherName = report.teacherName?.trim() || "—";
  const statusLabel = resolveLessonReportStatusLabel(report.status, lessonReportStatusLabels);
  const durationLabel = formatRecentLessonReportDuration(report.durationMinutes);

  return (
    <Stack
      sx={theme => ({
        gap: 1,
        [theme.breakpoints.down(narrowMobileMaxWidth)]: { gap: 1.5 },
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
          <MobileClassProfileLink
            href={report.classInstanceId ? classHref(report.classInstanceId) : undefined}
            name={subjectName}
            avatarUrl={report.classAvatarUrl}
            avatarSize={36}
            typographyVariant="titleLg"
            fontWeight={700}
          />
        </Box>
        {report.status ? (
          <MobileStatusBadge
            category="session"
            status={lessonReportStatusSessionKey(report.status)}
            label={statusLabel}
            size="small"
            typographyVariant="labelSm"
          />
        ) : null}
        <Box
          sx={theme => ({
            flexShrink: 0,
            [theme.breakpoints.down(narrowMobileMaxWidth)]: { display: "none" },
          })}
        >
          <AddReflectionButton
            label={labels.addReflection}
            classInstanceId={report.classInstanceId}
            onAddReflection={onAddReflection}
          />
        </Box>
      </Stack>

      <Box
        sx={theme => ({
          display: "none",
          width: "100%",
          [theme.breakpoints.down(narrowMobileMaxWidth)]: { display: "block" },
        })}
      >
        <AddReflectionButton
          layout="stacked"
          label={labels.addReflection}
          classInstanceId={report.classInstanceId}
          onAddReflection={onAddReflection}
        />
      </Box>

      <Box sx={metaRowSx}>
        <Box sx={teacherMetaSx}>
          <MobilePersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: report.teacherId })}
            name={teacherName}
            avatarUrl={report.teacherAvatarUrl}
            avatarSize={24}
            typographyVariant="labelMd"
            fontWeight={600}
          />
        </Box>
        <MetaSeparator />
        <Box sx={dateDurationMetaSx}>
          <Box sx={metaTruncateTextSx}>
            <DateTimeTooltipDisplay
              value={report.lessonDate}
              locale={locale}
              tone="muted"
              typographyVariant="labelSm"
            />
          </Box>
          <MetaSeparator />
          <Typography
            variant="labelSm"
            sx={theme => ({
              color: theme.palette.onSurfaceVariant,
              minWidth: 0,
              flex: "0 1 auto",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {durationLabel}
          </Typography>
        </Box>
      </Box>

      <RecentLessonReportCompletionBar completionPercentage={report.completionPercentage} />
    </Stack>
  );
}
