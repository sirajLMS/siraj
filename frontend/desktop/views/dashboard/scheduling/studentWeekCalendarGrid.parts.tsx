"use client";

import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import {
  addDays,
  type StudentClassRow,
} from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";
import {
  dayKeyOf,
  formatHour,
  gridLineColor,
  groupClassesByDayKey,
  HOURS,
} from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.helpers";
import { WeekDayHeader } from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendarGrid.header.parts";
import { SessionCard } from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendarSessionCard.parts";

type WeekGridProps = Readonly<{
  classes: readonly StudentClassRow[];
  weekStart: Date;
  locale: string;
  defaultSubject: string;
}>;

type DayColumnProps = Readonly<{
  dayDate: Date;
  dayClasses: readonly StudentClassRow[];
  locale: string;
  defaultSubject: string;
}>;

function HourGutter({ locale }: Readonly<{ locale: string }>) {
  return (
    <Box sx={{ minWidth: 60, display: "flex", flexDirection: "column" }}>
      {HOURS.map(hour => (
        <Box
          key={hour}
          sx={theme => ({
            height: 60,
            p: 0.5,
            textAlign: "right",
            borderBottom: `1px solid ${gridLineColor(theme)}`,
          })}
        >
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled, fontSize: "0.7rem" })}>
            {formatHour(hour, locale)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function WeekDayColumn({ dayClasses, locale, defaultSubject }: DayColumnProps) {
  return (
    <Box
      sx={theme => ({
        flex: 1,
        borderLeft: `1px solid ${gridLineColor(theme)}`,
        position: "relative",
      })}
    >
      {HOURS.map(hour => (
        <Box
          key={hour}
          sx={theme => ({
            height: 60,
            borderBottom: `1px solid ${gridLineColor(theme)}`,
          })}
        />
      ))}
      {dayClasses.map(cls => {
        const startDate = new Date(cls.scheduledStartAt);
        const hourIndex = startDate.getHours() - HOURS[0];
        if (hourIndex < 0 || hourIndex >= HOURS.length) return null;
        return (
          <Box key={cls.id} sx={{ position: "absolute", top: hourIndex * 60 + 2, left: 2, right: 2, zIndex: 1 }}>
            <SessionCard cls={cls} locale={locale} defaultSubject={defaultSubject} />
          </Box>
        );
      })}
    </Box>
  );
}

export function WeekGrid({ classes, weekStart, locale, defaultSubject }: WeekGridProps) {
  const classesByDayKey = useMemo(() => groupClassesByDayKey(classes), [classes]);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 600 }}>
      <WeekDayHeader weekStart={weekStart} locale={locale} />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <HourGutter locale={locale} />
        {Array.from({ length: 7 }, (_, idx) => {
          const dayDate = addDays(weekStart, idx);
          return (
            <WeekDayColumn
              key={dayDate.toISOString()}
              dayDate={dayDate}
              dayClasses={classesByDayKey.get(dayKeyOf(dayDate)) ?? []}
              locale={locale}
              defaultSubject={defaultSubject}
            />
          );
        })}
      </Box>
    </Box>
  );
}
