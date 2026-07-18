"use client";

import { PlayCircleOutlined } from "@mui/icons-material";
import { Box, Button, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatDateTime } from "@/frontend/common/components/intl/dateFormat";
import type { StudentDashboardLabels } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardLabels";
import type { UpcomingLessonRow } from "@/frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import type { AppLocale } from "@/shared/locale";

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
        {lesson.isFrozen ? (
          <Chip
            size="small"
            label="Frozen"
            sx={theme => ({
              backgroundColor: theme.palette.errorContainer,
              color: theme.palette.onErrorContainer,
            })}
          />
        ) : countdown ? (
          <Chip
            size="small"
            label={countdown}
            sx={theme => ({
              backgroundColor: theme.palette.tertiaryContainer,
              color: theme.palette.onTertiaryContainer,
              fontWeight: 700,
            })}
          />
        ) : null}
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

      {joinable ? (
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayCircleOutlined />}
          onClick={() => onJoin(lesson.id)}
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
          {labels.joinNow}
        </Button>
      ) : countdown ? (
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
      ) : null}
    </Box>
  );
}
