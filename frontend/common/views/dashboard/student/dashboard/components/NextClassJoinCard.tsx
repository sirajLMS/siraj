"use client";

import { PlayCircleOutlined } from "@mui/icons-material";
import { Box, Button, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import { CopyMeetingUrlButton } from "@/frontend/common/components/ui/display/meetingConfig";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { AppLocale, StudentPortalDashboardLabels as StudentDashboardLabels } from "@/shared/locale";

export interface NextClassJoinCardProps {
  readonly lesson: UpcomingLessonRow | null;
  readonly labels: StudentDashboardLabels;
  readonly locale: AppLocale;
  readonly onJoin: (id: string) => void;
}

function formatCountdown(dateString: string | null): string | null {
  if (!dateString) return null;
  const start = new Date(dateString).getTime();
  if (Number.isNaN(start)) return null;
  const now = Date.now();
  const diff = start - now;
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes <= 0) return null;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type NextClassChipProps = {
  readonly isFrozen: boolean | null | undefined;
  readonly countdown: string | null;
  readonly frozenLabel: string;
};

function NextClassChip({ isFrozen, countdown, frozenLabel }: NextClassChipProps): ReactNode {
  if (isFrozen) {
    return (
      <Chip
        size="small"
        label={frozenLabel}
        sx={theme => ({
          backgroundColor: theme.palette.errorContainer,
          color: theme.palette.onErrorContainer,
        })}
      />
    );
  }
  if (countdown) {
    return (
      <Chip
        size="small"
        label={countdown}
        sx={theme => ({
          backgroundColor: theme.palette.tertiaryContainer,
          color: theme.palette.onTertiaryContainer,
          fontWeight: 700,
        })}
      />
    );
  }
  return null;
}

type NextClassActionProps = {
  readonly joinable: boolean;
  readonly countdown: string | null;
  readonly lessonId: string;
  readonly meetingUrl: string | null | undefined;
  readonly joinNowLabel: string;
  readonly onJoin: (id: string) => void;
};

function NextClassAction({
  joinable,
  countdown,
  lessonId,
  meetingUrl,
  joinNowLabel,
  onJoin,
}: NextClassActionProps): ReactNode {
  if (joinable) {
    return (
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayCircleOutlined />}
          onClick={() => onJoin(lessonId)}
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            fontWeight: 700,
            borderRadius: 2,
            py: 1.25,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark ?? theme.palette.primary.main,
            },
          })}
        >
          {joinNowLabel}
        </Button>
        {meetingUrl ? <CopyMeetingUrlButton meetingUrl={meetingUrl} variant="icon" size="large" /> : null}
      </Stack>
    );
  }
  if (countdown) {
    return (
      <Box>
        <LinearProgress
          sx={theme => ({
            backgroundColor: theme.palette.onPrimaryContainer,
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.palette.primary.main,
            },
          })}
        />
      </Box>
    );
  }
  return null;
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
  const countdown = formatCountdown(lesson.scheduledStartAt);
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
          {lesson.durationMinutes} min
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
