"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { formatCountdown } from "@/frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.helpers";
import {
  NextClassAction,
  NextClassChip,
} from "@/frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.parts";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { AppLocale, StudentPortalDashboardLabels as StudentDashboardLabels } from "@/shared/locale";

export interface NextClassJoinCardProps {
  readonly lesson: UpcomingLessonRow | null;
  readonly labels: StudentDashboardLabels;
  readonly locale: AppLocale;
  readonly onJoin: (id: string) => void;
}

export function NextClassJoinCard({ lesson, labels, locale, onJoin }: Readonly<NextClassJoinCardProps>): ReactNode {
  if (!lesson) {
    return (
      <Box
        sx={theme => ({
          p: 3,
          borderRadius: 3,
          backgroundColor: theme.palette.surfaceContainer,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.noUpcomingClasses}
        </Typography>
      </Box>
    );
  }

  const joinable =
    isJoinableClassInstance(lesson.executionState, lesson.outcome, { isFrozen: lesson.isFrozen }) &&
    Boolean(lesson.meetingJoinUrl);
  const countdown = formatCountdown(lesson.scheduledStartAt, labels);
  const scheduledLabel = lesson.scheduledStartAt ? formatDateTime(lesson.scheduledStartAt, locale) : "";

  return (
    <Box
      sx={theme => ({
        p: 3,
        borderRadius: 3,
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimaryContainer,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onPrimaryContainer, opacity: 0.8 })}>
          {labels.nextClass}
        </Typography>
        <NextClassChip isFrozen={lesson.isFrozen} countdown={countdown} frozenLabel={labels.frozen} />
      </Stack>

      <Box>
        <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.onPrimaryContainer, fontWeight: 700 })}>
          {scheduledLabel}
        </Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onPrimaryContainer, opacity: 0.9 })}>
          {lesson.instructor}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onPrimaryContainer, opacity: 0.75 })}>
          {labels.durationMinutesShort(lesson.durationMinutes)}
        </Typography>
      </Box>

      <NextClassAction
        joinable={joinable}
        countdown={countdown}
        lessonId={lesson.id}
        meetingUrl={lesson.meetingJoinUrl}
        joinNowLabel={labels.joinNow}
        onJoin={onJoin}
      />
    </Box>
  );
}
