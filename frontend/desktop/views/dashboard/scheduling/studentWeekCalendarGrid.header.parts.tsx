"use client";

import { Box, Typography } from "@mui/material";
import {
  addDays,
  sameDay,
} from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";
import {
  createWeekdayFormatter,
  gridLineColor,
} from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.helpers";

function DayHeaderCell({
  dayDate,
  isToday,
  dayFormatter,
}: Readonly<{ dayDate: Date; isToday: boolean; dayFormatter: Intl.DateTimeFormat }>) {
  return (
    <Box
      sx={theme => ({
        flex: 1,
        p: 1,
        textAlign: "center",
        borderLeft: `1px solid ${gridLineColor(theme)}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
      })}
    >
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
        {dayFormatter.format(dayDate)}
      </Typography>
      <Typography
        variant="h6"
        sx={theme => ({
          fontWeight: 700,
          bgcolor: isToday ? theme.palette.primary.main : "transparent",
          color: isToday ? theme.palette.onPrimary : theme.palette.text.primary,
          borderRadius: "50%",
          width: 34,
          height: 34,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.95rem",
          transition: theme.transitions.create(["background-color", "color"], {
            duration: theme.transitions.duration.short,
          }),
        })}
      >
        {dayDate.getDate()}
      </Typography>
    </Box>
  );
}

export function WeekDayHeader({ weekStart, locale }: Readonly<{ weekStart: Date; locale: string }>) {
  const now = new Date();
  const dayFormatter = createWeekdayFormatter(locale);
  return (
    <Box sx={theme => ({ display: "flex", borderBottom: `1px solid ${gridLineColor(theme)}` })}>
      <Box sx={{ minWidth: 60, p: 1 }} />
      {Array.from({ length: 7 }, (_, idx) => {
        const dayDate = addDays(weekStart, idx);
        return (
          <DayHeaderCell
            key={dayDate.toISOString()}
            dayDate={dayDate}
            isToday={sameDay(dayDate, now)}
            dayFormatter={dayFormatter}
          />
        );
      })}
    </Box>
  );
}
