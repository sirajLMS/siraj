"use client";

import { Box, Stack } from "@mui/material";
import { classHref } from "@/frontend/common/utils/profileHref";
import { RecentLessonReportCompletionBar } from "@/frontend/common/views/dashboard/student/dashboard/components/recentLessonReportCompletionBar.shared";
import type { RecentLessonReportRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import type { StudentDashboardViewModel } from "@/frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel";
import {
  lessonReportStatusSessionKey,
  resolveLessonReportStatusLabel,
} from "@/frontend/common/views/dashboard/student/dashboard/utils/recentLessonReportPresentation";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { narrowMobileMaxWidth } from "@/frontend/mobile/views/dashboard/student/dashboard/components/recentLessonReportCard.constants";
import {
  AddReflectionButton,
  RecentLessonReportMetaRow,
} from "@/frontend/mobile/views/dashboard/student/dashboard/components/recentLessonReportCard.parts";

interface RecentLessonReportCardMobileProps {
  readonly report: RecentLessonReportRow;
  readonly labels: StudentDashboardViewModel["labels"];
  readonly lessonReportStatusLabels: StudentDashboardViewModel["lessonReportStatusLabels"];
  readonly locale: StudentDashboardViewModel["locale"];
  readonly onAddReflection: StudentDashboardViewModel["onAddReflection"];
}

export function RecentLessonReportCardMobile({
  report,
  labels,
  lessonReportStatusLabels,
  locale,
  onAddReflection,
}: Readonly<RecentLessonReportCardMobileProps>) {
  const subjectName = report.subjectName?.trim() ?? "—";
  const statusLabel = resolveLessonReportStatusLabel(report.status, lessonReportStatusLabels);

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

      <RecentLessonReportMetaRow report={report} locale={locale} />

      <RecentLessonReportCompletionBar completionPercentage={report.completionPercentage} />
    </Stack>
  );
}
