"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { TeacherAvailabilityGapItem } from "./TeacherAvailabilityDayPill";

export interface TeacherAvailabilityCalendarDay {
  readonly day: number;
  readonly gaps: readonly TeacherAvailabilityGapItem[];
}

interface TeacherAvailabilityCalendarGridProps {
  readonly currentMonth: Date;
  readonly daysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
}

function formatGapLabel(gap: TeacherAvailabilityGapItem): string {
  return `${gap.gapStartTime ?? ""} - ${gap.gapEndTime ?? ""}`;
}

function CalendarDayCell({ day, gaps }: Readonly<{ day: number; gaps: readonly TeacherAvailabilityGapItem[] }>) {
  const hasGaps = gaps.length > 0;

  return (
    <Box
      sx={theme => ({
        borderRight: `1px solid ${theme.palette.border.light}`,
        borderBottom: `1px solid ${theme.palette.border.light}`,
        padding: theme.spacing(1.5),
        backgroundColor: hasGaps ? theme.palette.surfaceContainerLow : theme.palette.background.paper,
        minHeight: 96,
      })}
    >
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {day}
      </Typography>

      {hasGaps ? (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {gaps.map(gap => (
            <Box
              key={gap.id ?? `${day}-${gap.gapStartTime}-${gap.gapEndTime}`}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <ScheduleOutlined sx={{ fontSize: 12, color: theme => theme.palette.onSurfaceVariant }} />
              <Chip label={formatGapLabel(gap)} size="small" color="primary" variant="outlined" />
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function EmptyCell({ day }: Readonly<{ day: number }>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.background.default,
        borderRight: `1px solid ${theme.palette.border.light}`,
        borderBottom: `1px solid ${theme.palette.border.light}`,
        padding: theme.spacing(1.5),
        opacity: 0.3,
      })}
    >
      <Typography variant="labelMd">{day}</Typography>
    </Box>
  );
}

export function TeacherAvailabilityCalendarGrid({
  currentMonth,
  daysByDate,
}: Readonly<TeacherAvailabilityCalendarGridProps>) {
  const t = useTranslations("dashboard.searchSchedule.calendar.days");

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

  const emptyStartDays = Array.from({ length: firstDayOfMonth }, (_, index) => {
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    return prevMonthDays - firstDayOfMonth + index + 1;
  });

  const remainingCells = 35 - (emptyStartDays.length + daysInMonth);
  const emptyEndDays = Array.from(
    { length: remainingCells > 0 ? remainingCells : remainingCells + 7 },
    (_, index) => index + 1
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: theme => theme.layout.radius.card,
        border: theme => `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: theme => `1px solid ${theme.palette.border.light}`,
          backgroundColor: theme => theme.palette.surfaceContainerLow,
        }}
      >
        {daysOfWeek.map(day => (
          <Box key={day} sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="buttonText" sx={theme => ({ color: theme.palette.onSecondaryContainer })}>
              {t(day)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {emptyStartDays.map(day => (
          <EmptyCell key={`start-${day}`} day={day} />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => (
          <CalendarDayCell key={day} day={day} gaps={daysByDate[day] ?? []} />
        ))}

        {emptyEndDays.map(day => (
          <EmptyCell key={`end-${day}`} day={day} />
        ))}
      </Box>
    </Paper>
  );
}
