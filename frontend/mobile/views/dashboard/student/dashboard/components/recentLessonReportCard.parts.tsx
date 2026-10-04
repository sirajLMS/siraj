"use client";

import { Box, Button, Typography } from "@mui/material";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import { formatRecentLessonReportDuration } from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";
import { MobilePersonProfileLinkCell } from "@/frontend/mobile/components/ui";
import {
  dateDurationMetaSx,
  metaRowSx,
  metaTruncateTextSx,
  reflectionButtonSx,
  teacherMetaSx,
} from "@/frontend/mobile/views/dashboard/student/dashboard/components/recentLessonReportCard.constants";

function MetaSeparator() {
  return (
    <Box
      component="span"
      sx={theme => ({
        fontSize: theme.typography.labelSm.fontSize,
        fontWeight: theme.typography.labelSm.fontWeight,
        color: theme.palette.onSurfaceVariant,
        flexShrink: 0,
        lineHeight: 1,
      })}
    >
      •
    </Box>
  );
}

interface AddReflectionButtonProps {
  readonly label: string;
  readonly classInstanceId: string | null | undefined;
  readonly onAddReflection: StudentDashboardViewModel["onAddReflection"];
  readonly layout?: "inline" | "stacked";
}

export function AddReflectionButton({
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

interface RecentLessonReportMetaRowProps {
  readonly report: RecentLessonReportRow;
  readonly locale: StudentDashboardViewModel["locale"];
}

export function RecentLessonReportMetaRow({ report, locale }: Readonly<RecentLessonReportMetaRowProps>) {
  const teacherName = report.teacherName?.trim() ?? "—";
  const durationLabel = formatRecentLessonReportDuration(report.durationMinutes);

  return (
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
          <DateTimeTooltipDisplay value={report.lessonDate} locale={locale} tone="muted" typographyVariant="labelSm" />
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
  );
}
