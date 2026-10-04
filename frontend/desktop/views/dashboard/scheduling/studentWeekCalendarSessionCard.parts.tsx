"use client";

import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { SessionActions } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions";
import type { StudentClassRow } from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";

const OUTCOME_CHIP_COLORS: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  PENDING: "default",
  COMPLETED: "success",
  CANCELLED: "error",
  ABSENT: "warning",
  LATE: "info",
};

const LOCK_WINDOW_HOURS = 12;

function OutcomeChip({ outcome }: Readonly<{ outcome: string }>) {
  return (
    <Chip
      size="small"
      color={OUTCOME_CHIP_COLORS[outcome] ?? "default"}
      variant="outlined"
      label={outcome}
      sx={{ borderRadius: 1.5 }}
    />
  );
}

export function SessionCard({
  cls,
  locale,
  defaultSubject,
}: Readonly<{ cls: StudentClassRow; locale: string; defaultSubject: string }>) {
  const startDate = new Date(cls.scheduledStartAt);
  const now = new Date();
  const locked = startDate.getTime() - now.getTime() < LOCK_WINDOW_HOURS * 60 * 60 * 1000;

  return (
    <Card
      variant="outlined"
      sx={theme => ({
        borderColor: theme.palette.primary.light,
        borderWidth: 1.5,
        borderRadius: 1.5,
        transition: "box-shadow 0.2s",
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        "&:hover": { boxShadow: 3, borderColor: theme.palette.primary.main },
      })}
    >
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700, fontSize: "0.7rem" })}
            >
              {formatTime(startDate, locale)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.75rem",
              }}
            >
              {cls.subjectName ?? defaultSubject}
            </Typography>
            <Typography
              variant="caption"
              sx={theme => ({
                color: theme.palette.text.secondary,
                fontSize: "0.7rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              })}
            >
              {cls.instructor}
            </Typography>
          </Box>
          <OutcomeChip outcome={cls.outcome} />
        </Stack>
        <Box sx={{ mt: 0.5 }}>
          <SessionActions classInstanceId={cls.id} locked={locked || startDate < now} compact />
        </Box>
      </CardContent>
    </Card>
  );
}
