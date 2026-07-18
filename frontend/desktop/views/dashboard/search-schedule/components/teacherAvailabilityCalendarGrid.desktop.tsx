"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Chip, Typography } from "@mui/material";
import type {
  TeacherAvailabilityCalendarGridProps,
  TeacherAvailabilityGapItem,
} from "@/frontend/common/views/dashboard/search-schedule/types";
import { formatGapLabel } from "@/frontend/common/views/dashboard/search-schedule/utils";
import {
  CalendarGridContainer,
  CalendarWeekdayHeader,
} from "@/frontend/common/views/dashboard/shared/CalendarGridShared";
import { computeCalendarGridLayout } from "@/frontend/common/views/dashboard/shared/calendarGridShared.utils";
import { useAppTranslation } from "@/shared/locale";

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

export function TeacherAvailabilityCalendarGridDesktop({
  currentMonth,
  daysByDate,
}: Readonly<TeacherAvailabilityCalendarGridProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;
  const { daysInMonth, emptyStartDays, emptyEndDays } = computeCalendarGridLayout(currentMonth);

  return (
    <CalendarGridContainer>
      <CalendarWeekdayHeader translateDay={day => t.calendar.days[day as keyof typeof t.calendar.days]} />

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
    </CalendarGridContainer>
  );
}
